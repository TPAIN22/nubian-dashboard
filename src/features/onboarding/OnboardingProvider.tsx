'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

import {
  useMerchantContext,
  useOnboardingState,
  useRefreshProductCount,
  useSaveOnboarding,
} from './api'
import { trackOnboarding } from './analytics'
import { CONTEXT_NOT_NEEDED } from './copy'
import {
  findStep,
  isTerminal,
  progressFor,
  resolveEntry,
  satisfiedSteps,
  stateFor,
  visibleSteps,
} from './state'
import { tourById, tourForPath, WIZARD_ROUTES } from './tours'
import { OnboardingTour } from './OnboardingTour'
import type { MerchantContext, OnboardingPatch, OnboardingStep, Tour } from './types'

/* ============================================================================
   OnboardingProvider
   ----------------------------------------------------------------------------
   Mounted once, inside the merchant shell and above the routed page, so a tour
   survives navigation: clicking the highlighted "المنتجات" row changes the page
   under it without the tour losing its place.

   It runs ONE tour at a time, chosen by the route. The console walkthrough owns
   the merchant console; the add-a-product walkthrough owns the product wizard.
   Neither knows the other exists — `tourForPath` decides, and everything below
   is written against "the active tour" rather than against a particular one.

   The three effects near the bottom are what make a tour feel like it is paying
   attention rather than reciting:

     - SATISFACTION. A step that asks for something real is only ticked off when
       the merchant has actually done it — the catalogue says so, not the Next
       button.
     - FOLLOWING. Clicking a highlighted nav item navigates AND advances, so the
       tour walks with the merchant instead of being abandoned on step three.
     - HANDING OVER. Walking into the product wizard swaps one tour for the
       other, and walking back out re-reads the catalogue so the console tour
       can settle its "add your first product" step honestly.
   ========================================================================== */

type OnboardingApi = {
  isOpen: boolean
  isAvailable: boolean
  /** The tour the current route belongs to, if any. */
  activeTourId: string | null
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
  /** Replays a tour from its first step. Defaults to the active one. */
  restart: (tourId?: string) => void
}

const OnboardingContext = React.createContext<OnboardingApi | null>(null)

/**
 * The tour controls, for anything that wants to drive them from outside —
 * the "جولة تعريفية" action in support, the "كيف أضيف منتج؟" action in the
 * product wizard.
 *
 * Returns null outside the provider rather than throwing: /admin mounts the
 * same console shell and the same product wizard, and a shared component asking
 * whether a tour exists should get "no" rather than an exception.
 */
export function useOnboarding(): OnboardingApi | null {
  return React.useContext(OnboardingContext)
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || ''

  const { tours: stored, loaded } = useOnboardingState()
  const save = useSaveOnboarding()
  const refreshProductCount = useRefreshProductCount()

  // Tours closed with the X, or finished, during this page life. Keyed by tour
  // id so dismissing the console walkthrough does not also suppress the wizard
  // one. Reset on a reload, which is what makes "resume where you left off"
  // mean something.
  const [dismissed, setDismissed] = React.useState<Record<string, boolean>>({})

  const tour: Tour | undefined = tourForPath(pathname)
  const state = tour ? stateFor(stored, tour.id) : null

  const tourCouldRun = Boolean(
    tour && loaded && state && !isTerminal(state.status) && !dismissed[tour.id],
  )

  // Evidence is only fetched for a tour that can run AND reads it. The console
  // shell renders on every merchant route and the catalogue is not free; the
  // add-a-product tour consults none of it and should not pay for it.
  const wantsContext = tourCouldRun && Boolean(tour?.needsMerchantContext)
  const fetched = useMerchantContext(wantsContext)
  const ctx: MerchantContext = tour?.needsMerchantContext ? fetched : CONTEXT_NOT_NEEDED

  const steps = React.useMemo(
    () => (tour ? visibleSteps(tour.steps, ctx) : []),
    [tour, ctx],
  )

  // Handed the FULL tour, not `steps`: resolving a stale resume point needs to
  // know where the missing step used to sit, which the filtered list cannot say.
  const entry = React.useMemo(
    () =>
      tour
        ? resolveEntry({ state, steps: tour.steps, ctx, loaded, tourVersion: tour.version })
        : { open: false, stepId: null, reason: 'closed' as const },
    [tour, state, ctx, loaded],
  )

  // A tour that does not open by itself waits to be asked for — but once asked
  // for, its state is IN_PROGRESS, which is no longer a first run.
  const allowedToOpen =
    entry.open && (tour?.autoStart || entry.reason !== 'first-run')

  // A tour waits for its evidence. Opening on step one and then re-numbering
  // itself a beat later when the product count lands is worse than opening a
  // moment after the dashboard does.
  const isOpen = Boolean(allowedToOpen && tour && !dismissed[tour.id] && ctx.ready)

  const currentStepId = entry.stepId
  const currentStep: OnboardingStep | undefined = findStep(steps, currentStepId)

  /* ---- persistence ------------------------------------------------------ */

  const persist = React.useCallback(
    (patch: OnboardingPatch) => {
      // Fire and forget. §Error handling: a failed write must never stop the
      // merchant moving — the optimistic cache and the local snapshot carry it.
      save.mutate(patch)
    },
    [save],
  )

  const goTo = React.useCallback(
    (stepId: string | null, completed?: string) => {
      if (!tour) return
      persist({
        tourId: tour.id,
        status: 'IN_PROGRESS',
        currentStep: stepId,
        version: tour.version,
        ...(completed ? { completedSteps: [completed] } : {}),
      })
    },
    [persist, tour],
  )

  /* ---- controls --------------------------------------------------------- */

  const complete = React.useCallback(() => {
    if (!tour) return
    trackOnboarding('onboarding_completed', { userId, tourId: tour.id, stepId: currentStepId })
    setDismissed((d) => ({ ...d, [tour.id]: true }))
    persist({ tourId: tour.id, status: 'COMPLETED', currentStep: null, version: tour.version })
  }, [persist, tour, userId, currentStepId])

  const advance = React.useCallback(
    (markCompleted: boolean) => {
      if (!tour || !currentStep) return
      const i = steps.findIndex((s) => s.id === currentStep.id)
      const upcoming = steps[i + 1]

      // A step with `satisfiedWhen` is never ticked off by pressing Next — the
      // whole point is that its completion is a fact about the store, not a
      // click. The satisfaction effect below records it when it becomes true.
      const completed =
        markCompleted && !currentStep.satisfiedWhen ? currentStep.id : undefined

      if (completed) {
        trackOnboarding('onboarding_step_completed', {
          userId,
          tourId: tour.id,
          stepId: completed,
        })
      }

      if (!upcoming) {
        complete()
        return
      }
      goTo(upcoming.id, completed)
    },
    [tour, currentStep, steps, goTo, complete, userId],
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
    if (!tour) return
    trackOnboarding('onboarding_skipped', { userId, tourId: tour.id, stepId: currentStepId })
    setDismissed((d) => ({ ...d, [tour.id]: true }))
    persist({ tourId: tour.id, status: 'SKIPPED', currentStep: null, version: tour.version })
  }, [persist, tour, userId, currentStepId])

  const dismiss = React.useCallback(() => {
    if (tour) setDismissed((d) => ({ ...d, [tour.id]: true }))
  }, [tour])

  const dismissForGood = skipTour

  const restart = React.useCallback(
    (tourId?: string) => {
      const target = tourId ? tourById(tourId) : tour
      if (!target) return

      trackOnboarding('onboarding_restarted', { userId, tourId: target.id })
      setDismissed((d) => ({ ...d, [target.id]: false }))
      // Back to the first step, not to wherever they stopped: somebody asking
      // for a tour again wants the tour, not the two steps they had left.
      //
      // `completedSteps` is deliberately left as it is. It records facts about
      // the store ("this merchant has added a product"), not places in a
      // slideshow, and the progress counter reads position in the step list
      // rather than that array — so keeping it costs nothing and a replay still
      // skips what no longer applies.
      persist({
        tourId: target.id,
        status: 'IN_PROGRESS',
        currentStep: target.steps[0]?.id ?? null,
        version: target.version,
      })
      if (target.restartHref && pathname !== target.restartHref) {
        router.push(target.restartHref)
      }
    },
    [persist, router, userId, tour, pathname],
  )

  /* ---- effect: real completion ------------------------------------------ */

  // A step that asks the merchant to do something is ticked off when the data
  // says they did it. Runs whether or not the tour is on screen, so a product
  // added from the wizard counts even though the console tour was not showing.
  const satisfied = React.useMemo(
    () => (tour ? satisfiedSteps(tour.steps, ctx) : []),
    [tour, ctx],
  )

  React.useEffect(() => {
    if (!tour || !loaded || !state || isTerminal(state.status)) return
    const newly = satisfied.filter((id) => !state.completedSteps.includes(id))
    if (newly.length === 0) return

    newly.forEach((id) =>
      trackOnboarding('onboarding_step_completed', { userId, tourId: tour.id, stepId: id }),
    )
    persist({ tourId: tour.id, completedSteps: newly })
  }, [satisfied, state, loaded, persist, userId, tour])

  /* ---- effect: follow the merchant -------------------------------------- */

  const previousPath = React.useRef(pathname)

  React.useEffect(() => {
    const from = previousPath.current
    previousPath.current = pathname
    if (from === pathname) return

    // Coming back from the wizard: re-read the catalogue so "add your first
    // product" can settle honestly. The wizard invalidates its own `["products"]`
    // key, which is not the one the merchant console reads.
    if (WIZARD_ROUTES.some((r) => from === r || from.startsWith(`${r}/`))) {
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

  const startedRef = React.useRef<Record<string, boolean>>({})
  React.useEffect(() => {
    if (!isOpen || !tour || startedRef.current[tour.id]) return
    startedRef.current[tour.id] = true
    if (entry.reason === 'first-run') {
      trackOnboarding('onboarding_started', { userId, tourId: tour.id, stepId: currentStepId })
    }
  }, [isOpen, tour, entry.reason, userId, currentStepId])

  const viewedRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!isOpen || !tour || !currentStepId) return
    const marker = `${tour.id}:${currentStepId}`
    if (viewedRef.current === marker) return
    viewedRef.current = marker

    const p = progressFor(steps, currentStepId)
    trackOnboarding('onboarding_step_viewed', {
      userId,
      tourId: tour.id,
      stepId: currentStepId,
      stepIndex: p?.current,
      stepTotal: p?.total,
    })
  }, [isOpen, tour, currentStepId, steps, userId])

  /* ---- api -------------------------------------------------------------- */

  const api = React.useMemo<OnboardingApi>(
    () => ({
      isOpen,
      isAvailable: loaded,
      activeTourId: tour?.id ?? null,
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
      tour,
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
