'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

import { useMerchantContext, useOnboardingState, useRefreshProductCount, useSaveOnboarding } from './api'
import { trackOnboarding } from './analytics'
import {
  findStep,
  isTerminal,
  progressFor,
  resolveEntry,
  satisfiedSteps,
  visibleSteps,
} from './state'
import { MERCHANT_TOUR, TOUR_PAUSED_ROUTES, TOUR_VERSION } from './steps'
import { OnboardingTour } from './OnboardingTour'
import type { MerchantContext, OnboardingStep } from './types'

/* ============================================================================
   OnboardingProvider
   ----------------------------------------------------------------------------
   Mounted once, inside the merchant shell and above the routed page, so the
   tour survives navigation: clicking the highlighted "المنتجات" row changes the
   page under it without the tour losing its place. Everything below is either
   a decision (delegated to the pure functions in state.ts) or a side effect
   (persist, navigate, emit an event).

   The three effects at the bottom are what make the tour feel like it is paying
   attention rather than reciting:

     - SATISFACTION. A step that asks for something real is only ticked off when
       the merchant has actually done it — the catalogue says so, not the Next
       button.
     - FOLLOWING. Clicking a highlighted nav item navigates AND advances, so the
       tour walks with the merchant instead of being abandoned on step three.
     - STEPPING ASIDE. On the product wizard the tour hides completely; the one
       screen it spent a step asking them to open is not a place to float a
       popover over.
   ========================================================================== */

type OnboardingApi = {
  isOpen: boolean
  isAvailable: boolean
  currentStepId: string | null
  next: () => void
  back: () => void
  skipStep: () => void
  skipTour: () => void
  complete: () => void
  /** Closes for this session; an unfinished tour resumes on the next visit. */
  dismiss: () => void
  /** "Later" and the welcome card's X — closes for good, restartable from Help. */
  dismissForGood: () => void
  restart: () => void
}

const OnboardingContext = React.createContext<OnboardingApi | null>(null)

/**
 * The tour's controls, for anything that wants to drive it from outside —
 * currently the "جولة تعريفية" action in the support screen.
 *
 * Returns null outside the provider rather than throwing: /admin mounts the
 * same console shell, and a shared component asking whether a tour exists
 * should get "no" rather than an exception.
 */
export function useOnboarding(): OnboardingApi | null {
  return React.useContext(OnboardingContext)
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || ''

  const { state, loaded } = useOnboardingState()
  const save = useSaveOnboarding()
  const refreshProductCount = useRefreshProductCount()

  // Closed with the X, or finished, during this page life. Reset on a reload,
  // which is what makes "resume where you left off" mean something.
  const [dismissedThisSession, setDismissed] = React.useState(false)

  const status = state?.status ?? 'NOT_STARTED'
  const tourCouldRun = loaded && !isTerminal(status) && !dismissedThisSession

  // Evidence is only worth fetching for a tour that can actually run. The shell
  // renders on every merchant route and the catalogue is not free.
  const ctx: MerchantContext = useMerchantContext(tourCouldRun)

  const steps = React.useMemo(() => visibleSteps(MERCHANT_TOUR, ctx), [ctx])

  // Handed the FULL tour, not `steps`: resolving a stale resume point needs to
  // know where the missing step used to sit, which the filtered list cannot say.
  const entry = React.useMemo(
    () => resolveEntry({ state, steps: MERCHANT_TOUR, ctx, loaded, tourVersion: TOUR_VERSION }),
    [state, ctx, loaded],
  )

  const paused = TOUR_PAUSED_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))

  // The tour waits for its evidence. Opening on step one and then re-numbering
  // itself a beat later when the product count lands is worse than opening a
  // moment after the dashboard does.
  const isOpen = entry.open && !dismissedThisSession && !paused && ctx.ready

  const currentStepId = entry.stepId
  const currentStep: OnboardingStep | undefined = findStep(steps, currentStepId)

  /* ---- persistence ------------------------------------------------------ */

  const persist = React.useCallback(
    (patch: Parameters<typeof save.mutate>[0]) => {
      // Fire and forget. §Error handling: a failed write must never stop the
      // merchant moving — the optimistic cache and the local snapshot carry it.
      save.mutate(patch)
    },
    [save],
  )

  const goTo = React.useCallback(
    (stepId: string | null, completed?: string) => {
      persist({
        status: 'IN_PROGRESS',
        currentStep: stepId,
        version: TOUR_VERSION,
        ...(completed ? { completedSteps: [completed] } : {}),
      })
    },
    [persist],
  )

  /* ---- controls --------------------------------------------------------- */

  const complete = React.useCallback(() => {
    trackOnboarding('onboarding_completed', { userId, stepId: currentStepId })
    setDismissed(true)
    persist({ status: 'COMPLETED', currentStep: null, version: TOUR_VERSION })
  }, [persist, userId, currentStepId])

  const advance = React.useCallback(
    (markCompleted: boolean) => {
      if (!currentStep) return
      const i = steps.findIndex((s) => s.id === currentStep.id)
      const upcoming = steps[i + 1]

      // A step with `satisfiedWhen` is never ticked off by pressing Next — the
      // whole point is that its completion is a fact about the store, not a
      // click. The satisfaction effect below records it when it becomes true.
      const completed =
        markCompleted && !currentStep.satisfiedWhen ? currentStep.id : undefined

      if (completed) {
        trackOnboarding('onboarding_step_completed', { userId, stepId: completed })
      }

      if (!upcoming) {
        complete()
        return
      }
      goTo(upcoming.id, completed)
    },
    [currentStep, steps, goTo, complete, userId],
  )

  const next = React.useCallback(() => advance(true), [advance])
  const skipStep = React.useCallback(() => advance(false), [advance])

  const back = React.useCallback(() => {
    if (!currentStep) return
    const i = steps.findIndex((s) => s.id === currentStep.id)
    const previous = steps[i - 1]
    if (previous) goTo(previous.id)
  }, [currentStep, steps, goTo])

  const skipTour = React.useCallback(() => {
    trackOnboarding('onboarding_skipped', { userId, stepId: currentStepId })
    setDismissed(true)
    persist({ status: 'SKIPPED', currentStep: null, version: TOUR_VERSION })
  }, [persist, userId, currentStepId])

  const dismiss = React.useCallback(() => setDismissed(true), [])

  const dismissForGood = skipTour

  const restart = React.useCallback(() => {
    trackOnboarding('onboarding_restarted', { userId })
    setDismissed(false)
    // Back to the welcome card, not to wherever they stopped: somebody asking
    // for the tour again wants the tour, not the two steps they had left.
    //
    // `completedSteps` is deliberately left as it is. It records facts about the
    // store ("this merchant has added a product"), not places in a slideshow,
    // and the progress counter reads position in the step list rather than that
    // array — so keeping it costs nothing and re-running the tour still skips
    // what no longer applies.
    persist({
      status: 'IN_PROGRESS',
      currentStep: MERCHANT_TOUR[0]?.id ?? null,
      version: TOUR_VERSION,
    })
    router.push('/merchant/dashboard')
  }, [persist, router, userId])

  /* ---- effect: real completion ------------------------------------------ */

  // A step that asks the merchant to do something is ticked off when the data
  // says they did it. Runs whether or not the tour is on screen, so a product
  // added from the wizard counts even though the tour was hidden at the time.
  const satisfied = React.useMemo(() => satisfiedSteps(MERCHANT_TOUR, ctx), [ctx])

  React.useEffect(() => {
    if (!loaded || !state || isTerminal(state.status)) return
    const newly = satisfied.filter((id) => !state.completedSteps.includes(id))
    if (newly.length === 0) return

    newly.forEach((id) => trackOnboarding('onboarding_step_completed', { userId, stepId: id }))
    persist({ completedSteps: newly })
  }, [satisfied, state, loaded, persist, userId])

  /* ---- effect: follow the merchant -------------------------------------- */

  const previousPath = React.useRef(pathname)

  React.useEffect(() => {
    const from = previousPath.current
    previousPath.current = pathname
    if (from === pathname) return

    // Coming back from the wizard: re-read the catalogue so "add your first
    // product" can settle honestly. The wizard invalidates its own `["products"]`
    // key, which is not the one the merchant console reads.
    if (TOUR_PAUSED_ROUTES.some((r) => from === r || from.startsWith(`${r}/`))) {
      refreshProductCount()
      return
    }

    if (!isOpen || !currentStep?.route) return
    // Evidence-gated steps are never completed by arriving somewhere. Returning
    // to /merchant/products after abandoning the wizard must not count as
    // having added a product.
    if (currentStep.satisfiedWhen) return
    if (pathname !== currentStep.route && !pathname.startsWith(`${currentStep.route}/`)) return

    advance(true)
    // `advance` is intentionally excluded: it changes identity on every step,
    // and re-running this on that alone would re-fire the navigation check for
    // a path that has not moved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isOpen, currentStep, refreshProductCount])

  /* ---- effect: analytics ------------------------------------------------- */

  const startedRef = React.useRef(false)
  React.useEffect(() => {
    if (!isOpen || startedRef.current) return
    startedRef.current = true
    if (entry.reason === 'first-run') {
      trackOnboarding('onboarding_started', { userId, stepId: currentStepId })
    }
  }, [isOpen, entry.reason, userId, currentStepId])

  const viewedRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!isOpen || !currentStepId || viewedRef.current === currentStepId) return
    viewedRef.current = currentStepId
    const p = progressFor(steps, currentStepId)
    trackOnboarding('onboarding_step_viewed', {
      userId,
      stepId: currentStepId,
      stepIndex: p?.current,
      stepTotal: p?.total,
    })
  }, [isOpen, currentStepId, steps, userId])

  /* ---- api -------------------------------------------------------------- */

  const api = React.useMemo<OnboardingApi>(
    () => ({
      isOpen,
      isAvailable: loaded,
      currentStepId,
      next,
      back,
      skipStep,
      skipTour,
      complete,
      dismiss,
      dismissForGood,
      restart,
    }),
    [
      isOpen,
      loaded,
      currentStepId,
      next,
      back,
      skipStep,
      skipTour,
      complete,
      dismiss,
      dismissForGood,
      restart,
    ],
  )

  return (
    <OnboardingContext.Provider value={api}>
      {children}
      {isOpen && currentStep && (
        <OnboardingTour
          step={currentStep}
          steps={steps}
          ctx={ctx}
          pathname={pathname}
          onNext={next}
          onBack={back}
          onSkipStep={skipStep}
          onSkipTour={skipTour}
          onComplete={complete}
          onDismiss={dismiss}
          onDismissForGood={dismissForGood}
          onNavigate={(href) => router.push(href)}
        />
      )}
    </OnboardingContext.Provider>
  )
}
