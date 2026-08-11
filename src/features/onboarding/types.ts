/* ============================================================================
   Onboarding — the shapes
   ----------------------------------------------------------------------------
   Kept free of React and of the DOM on purpose: everything that decides *what*
   the tour does next lives in `state.ts` and is a pure function of these types,
   which is what makes the decisions testable without mounting a dashboard.
   ========================================================================== */

/** Persisted lifecycle. `NOT_STARTED` is the only state that auto-opens the tour. */
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

/** Exactly what `GET/PUT /api/merchant/onboarding` stores. */
export type OnboardingState = {
  status: OnboardingStatus
  /** Step id to resume at, or null in a terminal state. */
  currentStep: string | null
  completedSteps: string[]
  version: number
  updatedAt: string | null
}

/** Progress for every tour the merchant has touched, keyed by tour id. */
export type OnboardingStateMap = Record<string, OnboardingState>

/** A partial write to ONE tour. Anything omitted keeps its stored value. */
export type OnboardingPatch = Partial<
  Pick<OnboardingState, 'status' | 'currentStep' | 'completedSteps' | 'version'>
> & { tourId: string }

/**
 * What the tour knows about the merchant's real situation.
 *
 * This is the whole of §"smart onboarding": steps consult this rather than
 * assuming every merchant is on their first minute. `ready` is false while the
 * underlying queries are still in flight — a step must never be skipped because
 * its evidence has not arrived yet.
 */
export type MerchantContext = {
  ready: boolean
  productCount: number
  orderCount: number
  /** The store has a description and at least one image — somebody set it up. */
  storeConfigured: boolean
  storeName?: string
}

/** Where the popover sits relative to its target, in logical (RTL-safe) terms. */
export type StepPlacement = 'block-start' | 'block-end' | 'inline-start' | 'inline-end'

export type OnboardingStep = {
  id: string
  /**
   * Value of the `data-onboarding` attribute on the element to highlight.
   * Omitted for the welcome and finish cards, which are centred dialogs.
   *
   * Never a CSS path — a selector that reaches through the sidebar's DOM would
   * break the first time somebody restyles a nav row.
   */
  target?: string
  /** Route the step belongs to. The tour offers to navigate there if elsewhere. */
  route?: string
  title: string
  /** Reads the merchant's real state so an established store is not lectured. */
  description: (ctx: MerchantContext) => string
  /** Renders as a centred card rather than a spotlight. */
  variant?: 'dialog' | 'spotlight'
  placement?: StepPlacement
  /** Label for the step's own action, when it has one beyond "next". */
  action?: { label: string; href: string }
  /**
   * Replaces the generic "open the section" line when this step's target is not
   * on screen. Some targets are missing because the merchant is on a phone;
   * others because a choice they made removed the field. Those want different
   * sentences.
   */
  missingHint?: string
  /** True when this step has nothing left to teach this particular merchant. */
  skipWhen?: (ctx: MerchantContext) => boolean
  /**
   * True when the merchant has genuinely done the thing the step asks for.
   * Derived from real data — never set by the act of clicking "next".
   */
  satisfiedWhen?: (ctx: MerchantContext) => boolean
  /** Excluded from the "n of m" count: framing, not a lesson. */
  chromeOnly?: boolean
}

/* -------------------------------------------------------------------------- */
/* Tours                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A tour is a step list plus the answer to "where does this run".
 *
 * Scoping by route is what lets two tours coexist without either knowing the
 * other exists: the console walkthrough owns the merchant console, the
 * add-a-product walkthrough owns the product wizard, and the provider simply
 * asks which one claims the current path.
 */
export type Tour = {
  id: string
  /**
   * Bumped only when the step list changes enough that a stored `currentStep`
   * would resume somebody in the wrong place. Copy edits do not count.
   */
  version: number
  steps: OnboardingStep[]
  /** True when this tour is responsible for the given pathname. */
  scope: (pathname: string) => boolean
  /**
   * Whether it opens by itself the first time a merchant lands in scope. A tour
   * with this off is help — it waits to be asked for.
   */
  autoStart: boolean
  /**
   * Whether its steps read the merchant's real state (product count, orders,
   * store profile). Off means the tour opens without waiting for — or paying
   * for — those queries.
   */
  needsMerchantContext: boolean
  /** Where "restart" sends the merchant before replaying. Omit to stay put. */
  restartHref?: string
  /** Label for the control that relaunches it from a help surface. */
  restartLabel: string
}

export type OnboardingEvent =
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_skipped'
  | 'onboarding_completed'
  | 'onboarding_restarted'
