/** @vitest-environment jsdom */
import * as React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyPatch, DEFAULT_STATE } from './state'
import { TOUR_VERSION } from './steps'
import type { MerchantContext, OnboardingPatch, OnboardingState } from './types'

/* ============================================================================
   The tour, from a merchant's seat
   ----------------------------------------------------------------------------
   These drive the provider, not the pure functions underneath it: does a
   first-time merchant get the welcome card, does a merchant who skipped it get
   left alone, does pressing "التالي" actually move, does the dashboard survive
   a backend that is down.

   The data layer is faked rather than the network, so the tests assert the
   tour's orchestration instead of TanStack Query's. The fake applies patches
   with the SAME `applyPatch` the real mutation uses, which is what keeps
   "progress persists" from being a test of a stub.

   jsdom lays nothing out, so every `getBoundingClientRect` is zero — and the
   tour reads a zero-size rect as "this element is not really on screen". That
   turns out to be useful rather than limiting: stubbing the rect gives us the
   desktop path (spotlight + anchored popover), and NOT stubbing it reproduces
   the phone exactly, because below `lg` the console's rail is `hidden lg:block`
   and its nav rows measure zero for the same reason.
   ========================================================================== */

const h = vi.hoisted(() => ({
  state: null as OnboardingState | null,
  loaded: true,
  ctx: null as MerchantContext | null,
  pathname: '/merchant/dashboard',
  version: 0,
  listeners: new Set<() => void>(),
  saves: [] as OnboardingPatch[],
  push: vi.fn(),
  refresh: vi.fn(),
}))

function emit() {
  h.version += 1
  h.listeners.forEach((l) => l())
}

/** Drives a pathname change the way the router would. */
function navigate(to: string) {
  h.pathname = to
  emit()
}

vi.mock('next/navigation', () => ({
  usePathname: () => h.pathname,
  useRouter: () => ({ push: h.push, replace: h.push, refresh: () => {} }),
}))

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ userId: 'user_test', isLoaded: true }),
}))

vi.mock('./api', async () => {
  const React_ = await import('react')
  const subscribe = (cb: () => void) => {
    h.listeners.add(cb)
    return () => {
      h.listeners.delete(cb)
    }
  }
  const snapshot = () => h.version

  return {
    useOnboardingState: () => {
      React_.useSyncExternalStore(subscribe, snapshot, snapshot)
      return { state: h.state, loaded: h.loaded, degraded: false }
    },
    useMerchantContext: () => {
      React_.useSyncExternalStore(subscribe, snapshot, snapshot)
      return h.ctx
    },
    useSaveOnboarding: () => ({
      mutate: (patch: OnboardingPatch) => {
        h.saves.push(patch)
        h.state = applyPatch(h.state ?? DEFAULT_STATE, patch)
        emit()
      },
    }),
    useRefreshProductCount: () => h.refresh,
  }
})

// Imported after the mocks so the provider picks them up.
const { OnboardingProvider } = await import('./OnboardingProvider')

/* -------------------------------------------------------------------------- */

const CONTEXT: MerchantContext = {
  ready: true,
  productCount: 0,
  orderCount: 0,
  storeConfigured: false,
  storeName: 'متجر النيل',
}

/** Every anchor the tour points at, as the console renders them. */
const TARGET_IDS = [
  'merchant-store',
  'merchant-products',
  'merchant-add-product',
  'merchant-orders',
  'merchant-analytics',
]

/**
 * Gives the anchors a real size, so the tour takes its desktop path.
 *
 * Restored automatically: `restoreMocks` is on in the vitest config, so the
 * next test starts back in the unlaid-out state that stands in for a phone.
 */
function layOutTargets() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: Element,
  ) {
    const measured = this instanceof HTMLElement && this.hasAttribute('data-onboarding')
    const box = measured
      ? { top: 200, left: 1040, width: 224, height: 30 }
      : { top: 0, left: 0, width: 320, height: 180 }
    return { ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => box } as DOMRect
  })
}

function setup({
  state = { ...DEFAULT_STATE, version: TOUR_VERSION },
  ctx = CONTEXT,
  loaded = true,
  pathname = '/merchant/dashboard',
  /** False reproduces a viewport where the rail is not rendered at all. */
  desktop = true,
}: {
  state?: OnboardingState | null
  ctx?: MerchantContext
  loaded?: boolean
  pathname?: string
  desktop?: boolean
} = {}) {
  h.state = state
  h.ctx = ctx
  h.loaded = loaded
  h.pathname = pathname
  h.saves = []
  h.version = 0

  if (desktop) layOutTargets()

  return render(
    <OnboardingProvider>
      <main>
        <button type="button">زر في الداشبورد</button>
        {TARGET_IDS.map((id) => (
          <a key={id} data-onboarding={id} href={`/${id}`}>
            {id}
          </a>
        ))}
      </main>
    </OnboardingProvider>,
  )
}

const dashboardStillWorks = () =>
  expect(screen.getByRole('button', { name: 'زر في الداشبورد' })).toBeTruthy()

beforeEach(() => {
  h.push.mockClear()
  h.refresh.mockClear()
  h.listeners.clear()
})

afterEach(cleanup)

/* -------------------------------------------------------------------------- */

describe('who sees the tour', () => {
  it('greets a first-time merchant by name', async () => {
    setup()
    expect(await screen.findByText(/أهلاً بيك في نوبيان/)).toBeTruthy()
    expect(screen.getByText(/متجر النيل/)).toBeTruthy()
  })

  it('leaves a merchant who completed it alone', () => {
    setup({ state: { ...DEFAULT_STATE, status: 'COMPLETED', version: TOUR_VERSION } })
    expect(screen.queryByText(/أهلاً بيك في نوبيان/)).toBeNull()
    dashboardStillWorks()
  })

  it('leaves a merchant who skipped it alone', () => {
    setup({ state: { ...DEFAULT_STATE, status: 'SKIPPED', version: TOUR_VERSION } })
    expect(screen.queryByText(/أهلاً بيك في نوبيان/)).toBeNull()
    dashboardStillWorks()
  })

  it('resumes a half-finished tour at the right step', async () => {
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        completedSteps: ['welcome', 'store', 'products'],
        version: TOUR_VERSION,
      },
    })
    expect(await screen.findByText('الطلبات 🛍️')).toBeTruthy()
    expect(screen.queryByText(/أهلاً بيك في نوبيان/)).toBeNull()
  })

  it('shows nothing — and breaks nothing — when the state cannot be loaded', () => {
    setup({ state: null, loaded: false })
    expect(screen.queryByText(/أهلاً بيك في نوبيان/)).toBeNull()
    dashboardStillWorks()
  })

  it('waits for the merchant context before opening', () => {
    setup({ ctx: { ...CONTEXT, ready: false } })
    // Opening now would mean re-numbering the progress counter a beat later.
    expect(screen.queryByText(/أهلاً بيك في نوبيان/)).toBeNull()
    dashboardStillWorks()
  })

  it('stands aside entirely on the product wizard', () => {
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'add-product',
        version: TOUR_VERSION,
      },
      pathname: '/merchant/products/new',
    })
    expect(screen.queryByText('أضف أول منتج')).toBeNull()
  })
})

describe('moving through the tour', () => {
  it('advances and persists on every step', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(await screen.findByRole('button', { name: 'يلا نبدأ' }))
    expect(await screen.findByText('متجرك')).toBeTruthy()

    // Persisted, not just rendered — this is what survives a reload.
    expect(h.saves.at(-1)).toMatchObject({ status: 'IN_PROGRESS', currentStep: 'store' })
    expect(h.state?.currentStep).toBe('store')

    // `findBy`, not `getBy`: the card opens as a floating fallback and swaps to
    // the anchored popover once the rail row has been located, which is a frame
    // later. "التالي" is the anchored spelling of the primary action.
    await user.click(await screen.findByRole('button', { name: 'التالي' }))
    expect(await screen.findByText('منتجاتك 📦')).toBeTruthy()
    expect(h.state?.completedSteps).toContain('store')
  })

  it('goes back', async () => {
    const user = userEvent.setup()
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        version: TOUR_VERSION,
      },
    })

    await user.click(await screen.findByRole('button', { name: 'رجوع' }))
    expect(await screen.findByText('أضف أول منتج')).toBeTruthy()
  })

  it('shows how far along the merchant is', async () => {
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        version: TOUR_VERSION,
      },
    })
    // welcome and finish are not counted.
    expect(await screen.findByText('4 من 5')).toBeTruthy()
  })

  it('renumbers when a step does not apply to this merchant', async () => {
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        version: TOUR_VERSION,
      },
      ctx: { ...CONTEXT, productCount: 7 },
    })
    expect(await screen.findByText('3 من 4')).toBeTruthy()
  })

  it('finishes, and marks itself completed', async () => {
    const user = userEvent.setup()
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'finish',
        version: TOUR_VERSION,
      },
    })

    await user.click(await screen.findByRole('button', { name: 'إغلاق' }))
    await waitFor(() => expect(h.state?.status).toBe('COMPLETED'))
    expect(screen.queryByText(/متجرك جاهز/)).toBeNull()
  })
})

describe('skipping', () => {
  it('confirms before skipping, and can be backed out of', async () => {
    const user = userEvent.setup()
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        version: TOUR_VERSION,
      },
    })

    await user.click(await screen.findByRole('button', { name: 'تخطي الجولة' }))
    expect(await screen.findByText('متأكد عايز تتخطى الجولة؟')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'رجوع' }))
    await waitFor(() => expect(screen.queryByText('متأكد عايز تتخطى الجولة؟')).toBeNull())
    expect(h.state?.status).toBe('IN_PROGRESS')
    expect(screen.getByText('الطلبات 🛍️')).toBeTruthy()
  })

  it('persists SKIPPED once confirmed, and closes', async () => {
    const user = userEvent.setup()
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        version: TOUR_VERSION,
      },
    })

    await user.click(await screen.findByRole('button', { name: 'تخطي الجولة' }))
    await user.click(await screen.findByRole('button', { name: 'تخطي' }))

    await waitFor(() => expect(h.state?.status).toBe('SKIPPED'))
    expect(screen.queryByText('الطلبات 🛍️')).toBeNull()
    dashboardStillWorks()
  })

  it('treats "لاحقاً" on the welcome card as a skip, so it does not nag', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(await screen.findByRole('button', { name: 'لاحقاً' }))
    await waitFor(() => expect(h.state?.status).toBe('SKIPPED'))
  })
})

describe('the actionable step', () => {
  it('sends the merchant to the real product form', async () => {
    const user = userEvent.setup()
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'add-product',
        version: TOUR_VERSION,
      },
      pathname: '/merchant/products',
    })

    await user.click(await screen.findByRole('button', { name: 'إضافة منتج' }))
    expect(h.push).toHaveBeenCalledWith('/merchant/products/new')
  })

  it('does not mark the step done just because Next was pressed', async () => {
    const user = userEvent.setup()
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'add-product',
        version: TOUR_VERSION,
      },
      pathname: '/merchant/products',
    })

    await user.click(await screen.findByRole('button', { name: 'تخطي' }))
    expect(await screen.findByText('الطلبات 🛍️')).toBeTruthy()
    expect(h.state?.completedSteps ?? []).not.toContain('add-product')
  })

  it('marks it done when a product actually exists', async () => {
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'add-product',
        version: TOUR_VERSION,
      },
      pathname: '/merchant/products',
    })
    expect(await screen.findByText('أضف أول منتج')).toBeTruthy()

    // The merchant created one. The catalogue now says so.
    h.ctx = { ...CONTEXT, productCount: 1 }
    emit()

    await waitFor(() => expect(h.state?.completedSteps).toContain('add-product'))
    expect(await screen.findByText('الطلبات 🛍️')).toBeTruthy()
  })

  it('re-reads the catalogue on the way back from the wizard', async () => {
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'add-product',
        version: TOUR_VERSION,
      },
      pathname: '/merchant/products/new',
    })

    navigate('/merchant/products')
    await waitFor(() => expect(h.refresh).toHaveBeenCalled())
  })
})

describe('route changes', () => {
  it('follows the merchant when they click the highlighted section', async () => {
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'products',
        version: TOUR_VERSION,
      },
    })
    expect(await screen.findByText('منتجاتك 📦')).toBeTruthy()

    navigate('/merchant/products')

    // Continues on the products page rather than ending the tour.
    expect(await screen.findByText('أضف أول منتج')).toBeTruthy()
    expect(h.state?.completedSteps).toContain('products')
  })

  it('survives a navigation that has nothing to do with the current step', async () => {
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        version: TOUR_VERSION,
      },
    })
    expect(await screen.findByText('الطلبات 🛍️')).toBeTruthy()

    navigate('/merchant/coupons')

    expect(await screen.findByText('الطلبات 🛍️')).toBeTruthy()
    dashboardStillWorks()
  })
})

describe('on a phone, where the rail is not rendered', () => {
  // `desktop: false` leaves every rect at jsdom's 0×0 — which is exactly what
  // the console produces below `lg`, where the rail is `hidden lg:block` and
  // its nav rows sit in the DOM with no layout at all.
  it('degrades to a card that still teaches, and offers the way there', async () => {
    const user = userEvent.setup()
    setup({
      desktop: false,
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        version: TOUR_VERSION,
      },
    })

    expect(await screen.findByText('الطلبات 🛍️')).toBeTruthy()
    expect(screen.getByText(/أي طلب جديد من الزبائن/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'فتح الطلبات' }))
    expect(h.push).toHaveBeenCalledWith('/merchant/orders')
  })

  it('does not crash the dashboard when a target is missing entirely', async () => {
    setup({
      desktop: false,
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'sales',
        version: TOUR_VERSION,
      },
    })
    expect(await screen.findByText('مبيعاتك 💰')).toBeTruthy()
    dashboardStillWorks()
  })
})

describe('accessibility', () => {
  it('labels the step card with its own title and description', async () => {
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        version: TOUR_VERSION,
      },
    })

    const dialog = await screen.findByRole('dialog')
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!)
    const description = document.getElementById(dialog.getAttribute('aria-describedby')!)
    expect(title?.textContent).toBe('الطلبات 🛍️')
    expect(description?.textContent).toMatch(/أي طلب جديد/)
  })

  it('opens the skip confirmation on Escape rather than silently vanishing', async () => {
    const user = userEvent.setup()
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'orders',
        version: TOUR_VERSION,
      },
    })

    await screen.findByText('الطلبات 🛍️')
    ;(await screen.findByRole('dialog')).focus()
    await user.keyboard('{Escape}')

    expect(await screen.findByText('متأكد عايز تتخطى الجولة؟')).toBeTruthy()
    // Nothing has been persisted yet — Escape asks, it does not decide.
    expect(h.state?.status).toBe('IN_PROGRESS')
  })

  it('walks forward with the RTL-forward arrow key', async () => {
    const user = userEvent.setup()
    document.documentElement.setAttribute('dir', 'rtl')
    setup({
      state: {
        ...DEFAULT_STATE,
        status: 'IN_PROGRESS',
        currentStep: 'store',
        version: TOUR_VERSION,
      },
    })

    // Wait for the anchored frame, where the primary action is "next" rather
    // than "take me there".
    await screen.findByRole('button', { name: 'التالي' })
    ;(await screen.findByRole('dialog')).focus()
    // In Arabic, "forward" is leftward.
    await user.keyboard('{ArrowLeft}')

    expect(await screen.findByText('منتجاتك 📦')).toBeTruthy()
  })
})
