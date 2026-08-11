import { describe, expect, it } from 'vitest'

import {
  applyPatch,
  DEFAULT_STATE,
  findStep,
  isTerminal,
  mergeCompleted,
  nextStepId,
  normalizeState,
  normalizeStateMap,
  prevStepId,
  progressFor,
  resolveEntry,
  satisfiedSteps,
  stateFor,
  visibleSteps,
} from './state'
import { ADD_PRODUCT_TOUR, MERCHANT_CONSOLE_TOUR, TOURS, tourForPath } from './tours'
import type { MerchantContext, OnboardingState } from './types'

const MERCHANT_TOUR = MERCHANT_CONSOLE_TOUR.steps
const TOUR_VERSION = MERCHANT_CONSOLE_TOUR.version
const TOUR_ID = MERCHANT_CONSOLE_TOUR.id

/* ============================================================================
   The rules a merchant actually feels
   ----------------------------------------------------------------------------
   Every assertion here is about behaviour somebody would notice: whether the
   tour reappears after they finished it, where it picks up, whether it lectures
   a store that already has two hundred products.
   ========================================================================== */

const ctx = (over: Partial<MerchantContext> = {}): MerchantContext => ({
  ready: true,
  productCount: 0,
  orderCount: 0,
  storeConfigured: false,
  ...over,
})

const state = (over: Partial<OnboardingState> = {}): OnboardingState => ({
  ...DEFAULT_STATE,
  version: TOUR_VERSION,
  ...over,
})

const entry = (over: {
  state?: OnboardingState | null
  ctx?: MerchantContext
  loaded?: boolean
}) =>
  resolveEntry({
    state: over.state === undefined ? state() : over.state,
    // The full tour, as the provider passes it — resolving a stale resume point
    // needs to know where the vanished step used to sit.
    steps: MERCHANT_TOUR,
    ctx: over.ctx ?? ctx(),
    loaded: over.loaded ?? true,
    tourVersion: TOUR_VERSION,
  })

describe('normalizeState', () => {
  it('falls back to NOT_STARTED for junk', () => {
    expect(normalizeState(null).status).toBe('NOT_STARTED')
    expect(normalizeState('nonsense').status).toBe('NOT_STARTED')
    expect(normalizeState({ status: 'BANANA' }).status).toBe('NOT_STARTED')
  })

  it('drops a resume point carried alongside a terminal status', () => {
    // A stale tab posting {status: COMPLETED, currentStep: 'orders'} must not
    // leave behind a step id that could reopen the tour.
    expect(normalizeState({ status: 'COMPLETED', currentStep: 'orders' }).currentStep).toBeNull()
  })

  it('de-duplicates completed steps and ignores non-strings', () => {
    expect(
      normalizeState({ status: 'IN_PROGRESS', completedSteps: ['a', 'a', 7, 'b'] }).completedSteps,
    ).toEqual(['a', 'b'])
  })
})

describe('normalizeStateMap', () => {
  it('reads a tour the merchant has never opened as not started', () => {
    expect(stateFor(normalizeStateMap({}), TOUR_ID)).toEqual(DEFAULT_STATE)
    expect(stateFor(null, 'anything').status).toBe('NOT_STARTED')
  })

  it('survives junk without taking the console down with it', () => {
    expect(normalizeStateMap(null)).toEqual({})
    expect(normalizeStateMap(['nope'])).toEqual({})
    expect(stateFor(normalizeStateMap({ [TOUR_ID]: 'garbage' }), TOUR_ID).status).toBe(
      'NOT_STARTED',
    )
  })
})

describe('applyPatch', () => {
  const map = (s: Partial<OnboardingState> = {}) => ({ [TOUR_ID]: state(s) })

  it('unions completed steps rather than replacing them', () => {
    // Two tabs, two steps finished. Last-write-wins on the array would lose one.
    const next = applyPatch(map({ completedSteps: ['store'] }), {
      tourId: TOUR_ID,
      completedSteps: ['orders'],
    })
    expect(next[TOUR_ID]!.completedSteps.sort()).toEqual(['orders', 'store'])
  })

  it('clears the resume point when the tour ends', () => {
    const next = applyPatch(map({ currentStep: 'orders', status: 'IN_PROGRESS' }), {
      tourId: TOUR_ID,
      status: 'COMPLETED',
    })
    expect(next[TOUR_ID]!.currentStep).toBeNull()
  })

  it('leaves untouched fields alone', () => {
    const next = applyPatch(map({ currentStep: 'store', completedSteps: ['welcome'] }), {
      tourId: TOUR_ID,
      status: 'IN_PROGRESS',
    })
    expect(next[TOUR_ID]!.currentStep).toBe('store')
    expect(next[TOUR_ID]!.completedSteps).toEqual(['welcome'])
  })

  it('does not disturb the other tour', () => {
    // Finishing the wizard walkthrough must not touch the console one, and vice
    // versa — they are separate lifecycles that happen to share a document.
    const both = {
      [TOUR_ID]: state({ status: 'IN_PROGRESS', currentStep: 'orders' }),
      [ADD_PRODUCT_TOUR.id]: state({ status: 'COMPLETED' }),
    }
    const next = applyPatch(both, { tourId: TOUR_ID, status: 'SKIPPED' })
    expect(next[ADD_PRODUCT_TOUR.id]).toEqual(both[ADD_PRODUCT_TOUR.id])
    expect(next[TOUR_ID]!.status).toBe('SKIPPED')
  })

  it('creates an entry for a tour opened for the first time', () => {
    const next = applyPatch({}, { tourId: ADD_PRODUCT_TOUR.id, status: 'IN_PROGRESS' })
    expect(next[ADD_PRODUCT_TOUR.id]!.status).toBe('IN_PROGRESS')
  })
})

describe('tour scoping', () => {
  it('gives the product wizard to the add-a-product tour', () => {
    expect(tourForPath('/merchant/products/new')?.id).toBe(ADD_PRODUCT_TOUR.id)
  })

  it('gives the rest of the console to the console tour', () => {
    for (const path of [
      '/merchant/dashboard',
      '/merchant/products',
      '/merchant/orders',
      '/merchant/settings',
      '/merchant/support',
    ]) {
      expect(tourForPath(path)?.id).toBe(MERCHANT_CONSOLE_TOUR.id)
    }
  })

  it('leaves the console tour out of the wizards entirely', () => {
    // It spent a step asking the merchant to open this screen; hovering a
    // popover over it would be the tour obstructing its own advice.
    expect(MERCHANT_CONSOLE_TOUR.scope('/merchant/products/new')).toBe(false)
    expect(MERCHANT_CONSOLE_TOUR.scope('/merchant/categories/new')).toBe(false)
  })

  it('runs no tour outside the merchant console', () => {
    expect(tourForPath('/admin/products-advanced/new')).toBeUndefined()
    expect(tourForPath('/')).toBeUndefined()
  })

  it('does not claim the edit screen — that merchant already has a product', () => {
    expect(ADD_PRODUCT_TOUR.scope('/merchant/products/abc123/edit')).toBe(false)
  })

  it('gives every tour a distinct id and a way to be relaunched', () => {
    expect(new Set(TOURS.map((t) => t.id)).size).toBe(TOURS.length)
    for (const t of TOURS) expect(t.restartLabel.length).toBeGreaterThan(0)
  })
})

describe('the add-a-product tour', () => {
  const steps = ADD_PRODUCT_TOUR.steps

  it('opens and closes with a dialog and teaches in between', () => {
    expect(steps[0]!.variant).toBe('dialog')
    expect(steps[steps.length - 1]!.variant).toBe('dialog')
    expect(progressFor(steps, 'wizard-basics')).toEqual({ current: 2, total: 7 })
  })

  it('anchors every teaching step to a stable handle, never a selector', () => {
    for (const step of steps.filter((s) => !s.chromeOnly)) {
      expect(step.target).toMatch(/^wizard-[a-z-]+$/)
    }
  })

  it('explains the pricing step even when the field is not there to point at', () => {
    // Price lives on wizard step 1 for a simple product and on step 5 for a
    // variant one, so this target legitimately disappears.
    const pricing = findStep(steps, 'wizard-pricing')!
    expect(pricing.missingHint).toMatch(/التسعير/)
  })

  it('needs no store data, so it opens without waiting on queries', () => {
    expect(ADD_PRODUCT_TOUR.needsMerchantContext).toBe(false)
    expect(steps.some((s) => s.skipWhen || s.satisfiedWhen)).toBe(false)
  })

  it('ends where the merchant already is', () => {
    // No onward action: the finish card closes and leaves them in the wizard.
    expect(steps[steps.length - 1]!.action).toBeUndefined()
    expect(ADD_PRODUCT_TOUR.restartHref).toBeUndefined()
  })
})

describe('mergeCompleted', () => {
  it('is a set union', () => {
    expect(mergeCompleted(['a', 'b'], ['b', 'c']).sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('isTerminal', () => {
  it('covers both ways a tour can end', () => {
    expect(isTerminal('COMPLETED')).toBe(true)
    expect(isTerminal('SKIPPED')).toBe(true)
    expect(isTerminal('IN_PROGRESS')).toBe(false)
    expect(isTerminal('NOT_STARTED')).toBe(false)
  })
})

describe('smart onboarding', () => {
  it('drops "add your first product" once the store has products', () => {
    const ids = visibleSteps(MERCHANT_TOUR, ctx({ productCount: 12 })).map((s) => s.id)
    expect(ids).not.toContain('add-product')
    expect(ids).toContain('orders')
  })

  it('keeps every step while the evidence is still loading', () => {
    // The product count defaults to 0 before it lands. Filtering on that would
    // do the opposite of what the filter is for.
    const ids = visibleSteps(MERCHANT_TOUR, ctx({ ready: false, productCount: 0 })).map((s) => s.id)
    expect(ids).toContain('add-product')
  })

  it('rewords the orders step for a store that already has orders', () => {
    const step = findStep(MERCHANT_TOUR, 'orders')!
    expect(step.description(ctx({ orderCount: 0 }))).not.toBe(
      step.description(ctx({ orderCount: 40 })),
    )
  })

  it('rewords the store step for a store that is already set up', () => {
    const step = findStep(MERCHANT_TOUR, 'store')!
    expect(step.description(ctx({ storeConfigured: true }))).not.toBe(
      step.description(ctx({ storeConfigured: false })),
    )
  })

  it('reports a step as satisfied only from real data', () => {
    expect(satisfiedSteps(MERCHANT_TOUR, ctx({ productCount: 0 }))).toEqual([])
    expect(satisfiedSteps(MERCHANT_TOUR, ctx({ productCount: 1 }))).toEqual(['add-product'])
    // Not "satisfied" just because the numbers are unknown.
    expect(satisfiedSteps(MERCHANT_TOUR, ctx({ ready: false, productCount: 9 }))).toEqual([])
  })
})

describe('resolveEntry', () => {
  it('opens at the welcome card for a brand-new merchant', () => {
    const e = entry({ state: state({ status: 'NOT_STARTED' }) })
    expect(e).toMatchObject({ open: true, stepId: 'welcome', reason: 'first-run' })
  })

  it('never reopens for a merchant who finished it', () => {
    expect(entry({ state: state({ status: 'COMPLETED' }) }).open).toBe(false)
  })

  it('never reopens for a merchant who skipped it', () => {
    expect(entry({ state: state({ status: 'SKIPPED' }) }).open).toBe(false)
  })

  it('resumes a half-finished tour where it stopped', () => {
    const e = entry({
      state: state({ status: 'IN_PROGRESS', currentStep: 'orders', completedSteps: ['store'] }),
    })
    expect(e).toMatchObject({ open: true, stepId: 'orders', reason: 'resume' })
  })

  it('resumes at the first unfinished step when the stored one no longer applies', () => {
    // They left off on "add your first product" and then added one from the
    // wizard, so that step is gone by the time they come back.
    const e = entry({
      state: state({
        status: 'IN_PROGRESS',
        currentStep: 'add-product',
        completedSteps: ['welcome', 'store', 'products'],
      }),
      ctx: ctx({ productCount: 1 }),
    })
    expect(e.stepId).toBe('orders')
  })

  it('never resumes behind where the merchant had got to', () => {
    // They were on "add your first product" and added one, so the step is gone.
    // The earlier steps were never individually recorded — resuming at the
    // welcome card would read as the tour resetting itself.
    const e = entry({
      state: state({ status: 'IN_PROGRESS', currentStep: 'add-product', completedSteps: [] }),
      ctx: ctx({ productCount: 1 }),
    })
    expect(e.stepId).toBe('orders')
  })

  it('ignores a resume point written by a different version of the tour', () => {
    const e = resolveEntry({
      state: { ...state({ status: 'IN_PROGRESS', currentStep: 'orders' }), version: 99 },
      steps: MERCHANT_TOUR,
      ctx: ctx(),
      loaded: true,
      tourVersion: TOUR_VERSION,
    })
    expect(e.stepId).toBe('welcome')
  })

  it('stays shut when the state could not be loaded', () => {
    // The single most annoying failure available: replaying the whole tour at
    // somebody who finished it because one request timed out.
    expect(entry({ loaded: false, state: null }).open).toBe(false)
    expect(entry({ loaded: false, state: state({ status: 'NOT_STARTED' }) }).open).toBe(false)
  })
})

describe('navigation', () => {
  const steps = visibleSteps(MERCHANT_TOUR, ctx())

  it('walks forward and back through the visible steps', () => {
    expect(nextStepId(steps, 'welcome')).toBe('store')
    expect(prevStepId(steps, 'store')).toBe('welcome')
  })

  it('has nowhere to go back to from the first step', () => {
    expect(prevStepId(steps, 'welcome')).toBeNull()
  })

  it('reports the end of the tour', () => {
    expect(nextStepId(steps, steps[steps.length - 1]!.id)).toBeNull()
  })

  it('skips over a step this merchant does not need', () => {
    const withProducts = visibleSteps(MERCHANT_TOUR, ctx({ productCount: 3 }))
    expect(nextStepId(withProducts, 'products')).toBe('orders')
  })
})

describe('progressFor', () => {
  const steps = visibleSteps(MERCHANT_TOUR, ctx())

  it('counts only the steps that teach something', () => {
    // welcome and finish are framing; numbering them would advertise a
    // five-stop tour as seven.
    expect(progressFor(steps, 'store')).toEqual({ current: 1, total: 5 })
    expect(progressFor(steps, 'sales')).toEqual({ current: 5, total: 5 })
  })

  it('renders no counter on the welcome and finish cards', () => {
    expect(progressFor(steps, 'welcome')).toBeNull()
    expect(progressFor(steps, 'finish')).toBeNull()
  })

  it('shrinks the total when a step is skipped as unnecessary', () => {
    const withProducts = visibleSteps(MERCHANT_TOUR, ctx({ productCount: 3 }))
    expect(progressFor(withProducts, 'orders')).toEqual({ current: 3, total: 4 })
  })
})
