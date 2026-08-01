import * as React from 'react'
import { cn } from '@/lib/utils'
import { type Tone, toneChip, toneDot, toneText, toneFor } from './tone'

/* ============================================================================
   Status surfaces
   ========================================================================== */

/**
 * The single badge used everywhere a status is shown.
 *
 * Pass `status` to derive the tone from the canonical map, or `tone` to force
 * one. Defaults to the quiet `dot` style — a coloured dot with plain text reads
 * far better in a dense table than a wall of coloured pills.
 */
export function StatusBadge({
  status,
  tone,
  label,
  variant = 'dot',
  className,
}: {
  status?: string | null
  tone?: Tone
  /** Display text. Falls back to `status`. */
  label?: React.ReactNode
  variant?: 'dot' | 'chip'
  className?: string
}) {
  const t = tone ?? toneFor(status)
  const text = label ?? status ?? '—'

  if (variant === 'chip') {
    return (
      <span
        className={cn(
          'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-[5px] border px-1.5 py-0.5',
          'text-[11px] font-medium leading-4 whitespace-nowrap',
          toneChip[t],
          className,
        )}
      >
        {text}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 text-[12px] font-medium whitespace-nowrap',
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', toneDot[t])} aria-hidden />
      <span className="text-foreground">{text}</span>
    </span>
  )
}

/** Bare indicator dot, for use inside cells that already have their own text. */
export function Dot({ tone = 'neutral', className }: { tone?: Tone; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-1.5 shrink-0 rounded-full', toneDot[tone], className)}
    />
  )
}

/** Monospace identifier chip — order numbers, SKUs, ids. */
export function Code({ className, children }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] border border-border bg-canvas px-1 py-px',
        'font-mono text-[11px] leading-4 text-text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ============================================================================
   Alert — inline, never a modal
   ========================================================================== */

export function Alert({
  tone = 'info',
  title,
  action,
  className,
  children,
}: {
  tone?: Tone
  title?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-lg border px-3.5 py-3 text-[12px] leading-5',
        toneChip[tone],
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ============================================================================
   Delta — trend figure beside a stat
   ========================================================================== */

export function Delta({
  value,
  /** `up-is-good` inverts for cost/refund metrics when set to false. */
  positiveIsGood = true,
  suffix = '%',
  className,
}: {
  value: number | null | undefined
  positiveIsGood?: boolean
  suffix?: string
  className?: string
}) {
  if (value == null || Number.isNaN(value)) return null
  const flat = value === 0
  const good = positiveIsGood ? value > 0 : value < 0
  const tone: Tone = flat ? 'neutral' : good ? 'success' : 'danger'
  const arrow = flat ? '' : value > 0 ? '▲' : '▼'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-medium nums',
        toneText[tone],
        className,
      )}
      dir="ltr"
    >
      {arrow}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  )
}
