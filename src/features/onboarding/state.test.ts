import { describe, expect, it } from 'vitest'

import {
  applyPatch,
  DEFAULT_STATE,
  findStep,
  isTerminal,
  mergeCompleted,
  nextStepId,
  normalizeState,
  prevStepId,
  progressFor,
  resolveEntry,
  satisfiedSteps,
  visibleSteps,
} from './state'
import { MERCHANT_TOUR, TOUR_VERSION } from './steps'
import type { MerchantContext, OnboardingState } from './types'

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

describe('applyPatch', () => {
  it('unions completed steps rather than replacing them', () => {
    // Two tabs, two steps finished. Last-write-wins on the array would lose one.
    const next = applyPatch(state({ completedSteps: ['store'] }), { completedSteps: ['orders'] })
    expect(next.completedSteps.sort()).toEqual(['orders', 'store'])
  })

  it('clears the resume point when the tour ends', () => {
    const next = applyPatch(state({ currentStep: 'orders', status: 'IN_PROGRESS' }), {
      status: 'COMPLETED',
    })
    expect(next.currentStep).toBeNull()
  })

  it('leaves untouched fields alone', () => {
    const next = applyPatch(state({ currentStep: 'store', completedSteps: ['welcome'] }), {
      status: 'IN_PROGRESS',
    })
    expect(next.currentStep).toBe('store')
    expect(next.completedSteps).toEqual(['welcome'])
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
