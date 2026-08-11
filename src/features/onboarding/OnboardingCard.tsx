'use client'

import * as React from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/admin'
import { cn } from '@/lib/utils'

import { OnboardingProgress } from './OnboardingProgress'
import { TOUR_COPY } from './steps'

/* ============================================================================
   The card
   ----------------------------------------------------------------------------
   One body, two frames. The spotlight steps hang it off a nav row; the welcome
   and finish steps centre it in a Radix dialog. Rendering the same component in
   both is what stops the tour looking like two features stapled together.

   Everything is logical-direction (ps/pe, start/end, ms/me) so the Arabic
   reading order is the source of truth rather than an RTL override bolted on
   afterwards.
   ========================================================================== */

export type CardAction = { label: string; onClick: () => void }

export type OnboardingCardProps = {
  title: string
  description: string
  progress?: { current: number; total: number } | null
  /** Quiet notice above the buttons — e.g. the target is not on this screen. */
  hint?: string
  primary: CardAction
  secondary?: CardAction
  onBack?: () => void
  onSkip?: () => void
  onDismiss: () => void
  /** Wired to the frame's `aria-labelledby` / `aria-describedby`. */
  titleId?: string
  descriptionId?: string
  className?: string
}

export function OnboardingCard({
  title,
  description,
  progress,
  hint,
  primary,
  secondary,
  onBack,
  onSkip,
  onDismiss,
  titleId,
  descriptionId,
  className,
}: OnboardingCardProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        {progress ? (
          <OnboardingProgress current={progress.current} total={progress.total} />
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={TOUR_COPY.close}
          className="-me-1 grid size-6 shrink-0 place-items-center rounded-[5px] text-text-faint transition-colors hover:bg-canvas-hover hover:text-foreground focus-ring"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div>
        <h2
          id={titleId}
          className="text-[14px] font-semibold leading-5 tracking-[-0.006em] text-foreground"
        >
          {title}
        </h2>
        <p id={descriptionId} className="mt-1.5 text-[13px] leading-[21px] text-text-muted">
          {description}
        </p>
        {hint && <p className="mt-2 text-[12px] leading-[18px] text-text-faint">{hint}</p>}
      </div>

      <div className="mt-0.5 flex items-center gap-2">
        {onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip}>
            {TOUR_COPY.skipTour}
          </Button>
        )}
        <span className="flex-1" />
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            {TOUR_COPY.back}
          </Button>
        )}
        {secondary && (
          <Button variant="secondary" size="sm" onClick={secondary.onClick}>
            {secondary.label}
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={primary.onClick}>
          {primary.label}
        </Button>
      </div>
    </div>
  )
}
