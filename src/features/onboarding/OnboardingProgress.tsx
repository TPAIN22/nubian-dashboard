'use client'

import { cn } from '@/lib/utils'
import { TOUR_COPY } from './copy'

/* ============================================================================
   Progress
   ----------------------------------------------------------------------------
   A counter and a row of 4px dots. Deliberately the quietest thing on the card:
   the merchant is here to learn the dashboard, not to watch a progress bar, and
   a full-width bar in brand gold would out-shout the sentence next to it.

   The dots are decorative — the `aria-label` on the wrapper is what a screen
   reader announces, so nobody hears "bullet bullet bullet".
   ========================================================================== */

export function OnboardingProgress({
  current,
  total,
  className,
}: {
  current: number
  total: number
  className?: string
}) {
  const label = TOUR_COPY.progress(current, total)

  return (
    <div className={cn('flex items-center gap-2', className)} aria-label={label}>
      <span className="text-[11px] font-medium text-text-faint nums">{label}</span>
      <span aria-hidden className="flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'size-1 rounded-full transition-colors duration-200',
              i < current ? 'bg-brand' : 'bg-border-strong',
            )}
          />
        ))}
      </span>
    </div>
  )
}
