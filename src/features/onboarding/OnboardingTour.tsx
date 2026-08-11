'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import { OnboardingCard } from './OnboardingCard'
import { OnboardingPopover } from './OnboardingPopover'
import { OnboardingSpotlight } from './OnboardingSpotlight'
import { progressFor } from './state'
import { TOUR_COPY } from './steps'
import { useDirection, useTargetRect } from './use-target'
import type { MerchantContext, OnboardingStep } from './types'

/* ============================================================================
   OnboardingTour — the surface
   ----------------------------------------------------------------------------
   Three frames for one card, chosen by what is actually on screen:

     DIALOG    the welcome and finish cards. Centred, modal, Radix — the two
               moments where taking over the screen is the right call.
     POPOVER   a step whose target was found. Spotlight behind, card anchored.
     FLOATING  a step whose target is not on this screen. Below `lg` the console
               hides its rail entirely, so "highlight the nav item" has nothing
               to point at; rather than a spotlight around a 0×0 box, the step
               becomes a bottom-anchored card whose primary button takes the
               merchant to the section it was describing. Same content, same
               ordering, same progress — it just stops pretending there is a
               sidebar.

   The frame is a rendering decision only. Which step is current, and what
   pressing a button does, is decided in the provider.
   ========================================================================== */

export function OnboardingTour({
  step,
  steps,
  ctx,
  pathname,
  onNext,
  onBack,
  onSkipStep,
  onSkipTour,
  onComplete,
  onDismiss,
  onDismissForGood,
  onNavigate,
}: {
  step: OnboardingStep
  steps: readonly OnboardingStep[]
  ctx: MerchantContext
  pathname: string
  onNext: () => void
  onBack: () => void
  onSkipStep: () => void
  onSkipTour: () => void
  onComplete: () => void
  onDismiss: () => void
  onDismissForGood: () => void
  onNavigate: (href: string) => void
}) {
  const dir = useDirection()
  const reducedMotion = useReducedMotion()
  const [confirmingSkip, setConfirmingSkip] = React.useState(false)

  const isDialog = step.variant === 'dialog'
  const isFirst = steps[0]?.id === step.id
  const isLast = steps[steps.length - 1]?.id === step.id

  // The search keeps running behind the skip confirmation. Tearing the
  // spotlight down to ask "are you sure?" and putting it back when they say no
  // is more movement than the question is worth.
  const { rect, status } = useTargetRect(step.target, !isDialog)
  const anchored = !isDialog && status === 'found' && rect !== null
  // Nothing is painted while we are still looking. The alternative — showing
  // the fallback card immediately and replacing it with the popover a frame
  // later — is a visible flinch at the start of every single step.
  const searching = !isDialog && status === 'searching'

  const progress = progressFor(steps, step.id)
  const titleId = `onboarding-title-${step.id}`
  const descriptionId = `onboarding-description-${step.id}`

  /* ---- what the buttons do --------------------------------------------- */

  const description = step.description(ctx)

  // The welcome card's "لاحقاً" and the finish card's buttons are terminal by
  // design; every other step's X only closes for this session, so an unfinished
  // tour picks up where it stopped on the next visit.
  const dismissAction = isFirst && isDialog ? onDismissForGood : isLast ? onComplete : onDismiss

  const card = React.useMemo(() => {
    if (isDialog && isFirst) {
      return {
        primary: { label: TOUR_COPY.start, onClick: onNext },
        secondary: { label: TOUR_COPY.later, onClick: onDismissForGood },
        onBack: undefined,
        onSkip: undefined,
      }
    }

    if (isDialog && isLast) {
      return {
        primary: {
          label: TOUR_COPY.finishPrimary,
          onClick: () => {
            onComplete()
            onNavigate('/merchant/products')
          },
        },
        secondary: { label: TOUR_COPY.finishSecondary, onClick: onComplete },
        onBack: undefined,
        onSkip: undefined,
      }
    }

    // Two cases lead with the step's own action rather than with "التالي":
    //
    //   - the target is not on this screen, where "go there" is the only useful
    //     thing to offer — and it is also what advances the tour, since
    //     arriving at a step's route completes it;
    //   - the step asks for something real ("add your first product"), where
    //     offering the actual thing beats explaining it.
    const action = step.action
    if (action && (!anchored || step.satisfiedWhen)) {
      return {
        primary: { label: action.label, onClick: () => onNavigate(action.href) },
        secondary: { label: TOUR_COPY.skipStep, onClick: onSkipStep },
        onBack: isFirst ? undefined : onBack,
        onSkip: () => setConfirmingSkip(true),
      }
    }

    return {
      primary: { label: TOUR_COPY.next, onClick: onNext },
      secondary: undefined,
      onBack: isFirst ? undefined : onBack,
      onSkip: () => setConfirmingSkip(true),
    }
  }, [
    isDialog,
    isFirst,
    isLast,
    anchored,
    step,
    onNext,
    onBack,
    onSkipStep,
    onComplete,
    onDismissForGood,
    onNavigate,
  ])

  /* ---- keyboard ---------------------------------------------------------- */

  // Direction-aware: in Arabic the tour reads right-to-left, so ArrowLeft is
  // "forward". Hard-coding ArrowRight would have the keyboard walking backwards
  // through an RTL interface.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'

    if (e.key === forward) {
      e.preventDefault()
      card.primary.onClick()
    } else if (e.key === backward && card.onBack) {
      e.preventDefault()
      card.onBack()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (card.onSkip) card.onSkip()
      else dismissAction()
    }
  }

  const body = {
    title: step.title,
    description,
    progress,
    hint: !anchored && !isDialog ? TOUR_COPY.offRoute : undefined,
    titleId,
    descriptionId,
    onDismiss: dismissAction,
    ...card,
  }

  /* ---- skip confirmation ------------------------------------------------- */

  const confirmation = (
    <AlertDialog open={confirmingSkip} onOpenChange={setConfirmingSkip}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{TOUR_COPY.confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{TOUR_COPY.confirmBody}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{TOUR_COPY.confirmBack}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setConfirmingSkip(false)
              onSkipTour()
            }}
          >
            {TOUR_COPY.confirmSkip}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  /* ---- frames ------------------------------------------------------------ */

  if (isDialog) {
    return (
      <>
        <Dialog open onOpenChange={(open) => !open && dismissAction()}>
          <DialogContent
            // The card draws its own dismiss control, aligned with the progress
            // row; Radix's absolutely-positioned one would sit on top of it.
            className="gap-0 p-5 sm:max-w-md [&>button:last-child]:hidden"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onKeyDown={onKeyDown}
          >
            <OnboardingCard {...body} />
          </DialogContent>
        </Dialog>
        {confirmation}
      </>
    )
  }

  if (searching) return confirmation

  if (anchored) {
    return (
      <>
        <Portal>
          <OnboardingSpotlight rect={rect} reducedMotion={reducedMotion} />
        </Portal>
        <OnboardingPopover
          {...body}
          targetRect={rect}
          placement={step.placement}
          dir={dir}
          reducedMotion={reducedMotion}
          onKeyDown={onKeyDown}
          labelledBy={titleId}
          describedBy={descriptionId}
          focusKey={`${step.id}:${pathname}`}
        />
        {confirmation}
      </>
    )
  }

  return (
    <>
      <Portal>
        <FloatingCard
          onKeyDown={onKeyDown}
          labelledBy={titleId}
          describedBy={descriptionId}
          focusKey={step.id}
          reducedMotion={reducedMotion}
        >
          <OnboardingCard {...body} />
        </FloatingCard>
      </Portal>
      {confirmation}
    </>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Everything the tour paints goes to <body>.
 *
 * The shell's root is `overflow-hidden` and `<main>` scrolls independently.
 * Nothing there creates a containing block for `position: fixed` today — but
 * one `transform` added to the shell for an animation later would clip the
 * spotlight to the content pane, and that is a very confusing bug to find.
 */
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted || typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

/**
 * The no-target frame. Pinned to the bottom on phones (thumb reach, and it
 * leaves the content it is describing visible) and bottom-centred on desktop.
 * Not modal and not backed by a scrim — nothing here should stop the merchant
 * using the dashboard.
 */
function FloatingCard({
  children,
  onKeyDown,
  labelledBy,
  describedBy,
  focusKey,
  reducedMotion,
}: {
  children: React.ReactNode
  onKeyDown: (e: React.KeyboardEvent) => void
  labelledBy: string
  describedBy: string
  focusKey: string
  reducedMotion: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [focusKey])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{ boxShadow: 'var(--elev-dialog)' }}
      className={cn(
        'fixed inset-x-3 bottom-3 z-[60] rounded-lg border border-border bg-popover p-3.5 outline-none',
        // Physical `left` on purpose: horizontal centring is the same operation
        // in both directions, and a logical `start-1/2` would need its translate
        // flipped per direction to land in the same place.
        'sm:inset-x-auto sm:left-1/2 sm:w-80 sm:-translate-x-1/2',
        !reducedMotion &&
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200',
      )}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const read = () => setReduced(query.matches)
    read()
    query.addEventListener('change', read)
    return () => query.removeEventListener('change', read)
  }, [])

  return reduced
}
