import type {
  MerchantContext,
  OnboardingState,
  OnboardingStatus,
  OnboardingStep,
} from './types'

/* ============================================================================
   Onboarding state machine
   ----------------------------------------------------------------------------
   Every "what happens next" decision the tour makes is a pure function here.
   No React, no DOM, no fetch — so the rules that matter (does a returning
   merchant see this? where does a half-finished tour resume? what happens when
   the server is down?) can be asserted directly instead of inferred from a
   rendered popover.
   ========================================================================== */

export const DEFAULT_STATE: OnboardingState = {
  status: 'NOT_STARTED',
  currentStep: null,
  completedSteps: [],
  version: 1,
  updatedAt: null,
}

const STATUSES: OnboardingStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']

/** A tour that has been finished or abandoned never reopens by itself. */
export function isTerminal(status: OnboardingStatus): boolean {
  return status === 'COMPLETED' || status === 'SKIPPED'
}

/**
 * Coerces anything — a backend envelope, a localStorage blob written by an
 * older build, `undefined` — into a usable state.
 *
 * Tolerant by design. A corrupt cached value must degrade to "not started"
 * rather than throw inside a provider that wraps the whole console.
 */
export function normalizeState(raw: unknown): OnboardingState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE }
  const r = raw as Record<string, unknown>

  const status = STATUSES.includes(r.status as OnboardingStatus)
    ? (r.status as OnboardingStatus)
    : 'NOT_STARTED'

  const completedSteps = Array.isArray(r.completedSteps)
    ? Array.from(new Set(r.completedSteps.filter((s): s is string => typeof s === 'string')))
    : []

  return {
    status,
    // A terminal state has nowhere to resume to; carrying a step id there would
    // let a stale write reopen a tour the merchant already dismissed.
    currentStep: isTerminal(status) || typeof r.currentStep !== 'string' ? null : r.currentStep,
    completedSteps,
    version: typeof r.version === 'number' && r.version > 0 ? r.version : 1,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : null,
  }
}

/** Union, so progress made in one tab cannot erase progress made in another. */
export function mergeCompleted(a: readonly string[], b: readonly string[]): string[] {
  return Array.from(new Set([...a, ...b]))
}

/**
 * Applies a partial write the same way the backend does, so the optimistic copy
 * in the query cache and the row in Mongo cannot disagree.
 *
 * Two rules worth stating: `completedSteps` is unioned rather than replaced,
 * and reaching a terminal status clears `currentStep`.
 */
export function applyPatch(
  state: OnboardingState,
  patch: Partial<Pick<OnboardingState, 'status' | 'currentStep' | 'completedSteps' | 'version'>>,
): OnboardingState {
  const status = patch.status ?? state.status
  const completedSteps = patch.completedSteps
    ? mergeCompleted(state.completedSteps, patch.completedSteps)
    : state.completedSteps

  return {
    status,
    currentStep: isTerminal(status)
      ? null
      : patch.currentStep !== undefined
        ? patch.currentStep
        : state.currentStep,
    completedSteps,
    version: patch.version ?? state.version,
    updatedAt: new Date().toISOString(),
  }
}

/* -------------------------------------------------------------------------- */
/* Step selection                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The steps this particular merchant should see.
 *
 * `skipWhen` is only consulted once the context is `ready`. Dropping "add your
 * first product" because a still-loading query reports zero products would be
 * the exact opposite of the intended behaviour.
 */
export function visibleSteps(
  steps: readonly OnboardingStep[],
  ctx: MerchantContext,
): OnboardingStep[] {
  if (!ctx.ready) return [...steps]
  return steps.filter((s) => !s.skipWhen?.(ctx))
}

export function findStep(
  steps: readonly OnboardingStep[],
  id: string | null,
): OnboardingStep | undefined {
  return id ? steps.find((s) => s.id === id) : undefined
}

/** Step ids the merchant has demonstrably satisfied, from real data. */
export function satisfiedSteps(
  steps: readonly OnboardingStep[],
  ctx: MerchantContext,
): string[] {
  if (!ctx.ready) return []
  return steps.filter((s) => s.satisfiedWhen?.(ctx)).map((s) => s.id)
}

export function nextStepId(
  steps: readonly OnboardingStep[],
  from: string | null,
): string | null {
  const i = steps.findIndex((s) => s.id === from)
  if (i === -1) return steps[0]?.id ?? null
  return steps[i + 1]?.id ?? null
}

export function prevStepId(
  steps: readonly OnboardingStep[],
  from: string | null,
): string | null {
  const i = steps.findIndex((s) => s.id === from)
  if (i <= 0) return null
  return steps[i - 1]?.id ?? null
}

/**
 * "3 من 5".
 *
 * Counts only the steps that teach something — the welcome and finish cards are
 * framing, and numbering them makes a five-stop tour advertise itself as seven.
 * Returns null for those cards so the counter simply does not render.
 */
export function progressFor(
  steps: readonly OnboardingStep[],
  id: string | null,
): { current: number; total: number } | null {
  const lessons = steps.filter((s) => !s.chromeOnly)
  const i = lessons.findIndex((s) => s.id === id)
  if (i === -1) return null
  return { current: i + 1, total: lessons.length }
}

/* -------------------------------------------------------------------------- */
/* Entry decision                                                             */
/* -------------------------------------------------------------------------- */

export type Entry = {
  open: boolean
  stepId: string | null
  /** Why the tour opened — drives which analytics event fires. */
  reason: 'first-run' | 'resume' | 'closed'
}

/**
 * Whether the tour should be on screen at all, and where.
 *
 * `loaded` is the load-succeeded flag, and it is load-bearing. When the state
 * request fails we know nothing about this merchant, and "nothing" must not be
 * read as "new": replaying the whole tour at somebody who finished it last week
 * because an unrelated request timed out is the single most annoying failure
 * this feature could have. So a failed load opens nothing and the dashboard
 * carries on as normal.
 */
export function resolveEntry({
  state,
  steps,
  ctx,
  loaded,
  tourVersion,
}: {
  state: OnboardingState | null
  /** The full tour. Filtering to what this merchant needs happens here. */
  steps: readonly OnboardingStep[]
  ctx: MerchantContext
  loaded: boolean
  tourVersion: number
}): Entry {
  const closed: Entry = { open: false, stepId: null, reason: 'closed' }

  if (!loaded || !state) return closed
  if (isTerminal(state.status)) return closed

  const available = visibleSteps(steps, ctx)
  if (available.length === 0) return closed

  if (state.status === 'NOT_STARTED') {
    return { open: true, stepId: available[0]!.id, reason: 'first-run' }
  }

  // IN_PROGRESS — resume as close to where they left off as the current step
  // list allows. A stored id can have gone stale two ways: the tour's shape
  // changed under it (version bump), or the step no longer applies to this
  // merchant (they added the product it was asking for).
  const versionMatches = state.version === tourVersion
  const stored = versionMatches ? available.find((s) => s.id === state.currentStep) : undefined
  if (stored) return { open: true, stepId: stored.id, reason: 'resume' }

  // The stored step is gone. Resume FORWARD of where it used to sit, never
  // behind it: the merchant who was on "add your first product" and then added
  // one has moved on, and dropping them back at the welcome card because the
  // earlier steps were not individually recorded would read as a reset.
  const storedIndex = versionMatches ? steps.findIndex((s) => s.id === state.currentStep) : -1

  const resumeAt =
    (storedIndex >= 0
      ? available.find(
          (s) =>
            steps.findIndex((f) => f.id === s.id) >= storedIndex &&
            !state.completedSteps.includes(s.id),
        )
      : undefined) ??
    available.find((s) => !state.completedSteps.includes(s.id)) ??
    available[available.length - 1]!

  return { open: true, stepId: resumeAt.id, reason: 'resume' }
}
