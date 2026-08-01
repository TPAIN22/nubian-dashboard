import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/admin/status'
import type { Tone as AdminTone } from '@/components/admin/tone'

/**
 * Semantic status colours for the admin surfaces.
 *
 * This is now a thin adapter over the admin design system's `StatusBadge`
 * (src/components/admin/status.tsx), which owns the tone palette. Keeping the
 * `ToneBadge` signature means every existing call site — orders, notifications,
 * merchants, support — picks up the new treatment without being touched.
 *
 * The visual change: pills are no longer full-radius saturated capsules. The
 * default is a dot + plain label, which is much easier to scan down a dense
 * column; pass `withDot={false}` for the soft filled chip instead.
 */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted'

const TO_ADMIN_TONE: Record<Tone, AdminTone> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  muted: 'neutral',
}

export function ToneBadge({
  tone = 'muted',
  withDot = true,
  className,
  children,
}: {
  tone?: Tone
  withDot?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <StatusBadge
      tone={TO_ADMIN_TONE[tone]}
      variant={withDot ? 'dot' : 'chip'}
      label={children}
      className={cn('whitespace-nowrap', className)}
    />
  )
}

/**
 * Retained for the places that tint a surface rather than render a badge (row
 * highlights, legends). Mapped onto the same tone tokens so they cannot drift
 * away from the badges again.
 */
export const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-tone-success-bg text-tone-success-fg ring-1 ring-inset ring-tone-success-border',
  warning: 'bg-tone-warning-bg text-tone-warning-fg ring-1 ring-inset ring-tone-warning-border',
  danger: 'bg-tone-danger-bg text-tone-danger-fg ring-1 ring-inset ring-tone-danger-border',
  info: 'bg-tone-info-bg text-tone-info-fg ring-1 ring-inset ring-tone-info-border',
  muted: 'bg-tone-neutral-bg text-tone-neutral-fg ring-1 ring-inset ring-tone-neutral-border',
}

export const TONE_DOT_CLASS: Record<Tone, string> = {
  success: 'bg-tone-success-fg',
  warning: 'bg-tone-warning-fg',
  danger: 'bg-tone-danger-fg',
  info: 'bg-tone-info-fg',
  muted: 'bg-tone-neutral-fg',
}
