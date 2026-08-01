import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Delta } from './status'

/* ============================================================================
   Statistics
   ----------------------------------------------------------------------------
   Deliberately NOT cards. Four bordered cards with an icon in the corner is the
   single most template-looking pattern in admin software. Instead: one bordered
   rail divided by hairlines, Stripe-style. It reads as a unit, costs a quarter
   of the vertical space, and keeps the numbers aligned on a common baseline.
   ========================================================================== */

export function StatRow({
  columns = 4,
  className,
  children,
}: {
  columns?: 2 | 3 | 4 | 5
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'grid overflow-hidden rounded-lg border border-border bg-card',
        // Hairlines between cells, drawn with a gap + background so they work
        // identically in RTL and wrap cleanly.
        'gap-px bg-border',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-3',
        columns === 4 && 'grid-cols-2 lg:grid-cols-4',
        columns === 5 && 'grid-cols-2 lg:grid-cols-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

type StatProps = {
  label: React.ReactNode
  value: React.ReactNode
  /** Percentage change vs. the previous period. */
  delta?: number | null
  positiveIsGood?: boolean
  /** One short line under the value — comparison window, or a call to action. */
  hint?: React.ReactNode
  /** Turns the whole cell into a link with a hover affordance. */
  href?: string
  /** Draws attention without a coloured background: a brand rule on the inline start edge. */
  emphasis?: boolean
  loading?: boolean
  className?: string
}

export function Stat({
  label,
  value,
  delta,
  positiveIsGood = true,
  hint,
  href,
  emphasis,
  loading,
  className,
}: StatProps) {
  const body = (
    <>
      {emphasis && (
        <span
          aria-hidden
          className="absolute inset-y-0 start-0 w-0.5 bg-brand"
        />
      )}
      <div className="flex items-center gap-1.5">
        <span className="truncate text-[12px] font-medium text-text-muted">{label}</span>
      </div>

      {loading ? (
        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-canvas-hover" />
      ) : (
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="truncate text-[24px] font-semibold leading-8 tracking-[-0.02em] text-foreground nums">
            {value}
          </span>
          <Delta value={delta} positiveIsGood={positiveIsGood} />
        </div>
      )}

      {hint && (
        <div className="mt-1 truncate text-[11px] leading-4 text-text-faint">{hint}</div>
      )}
    </>
  )

  const cls = cn(
    'relative min-w-0 bg-card px-4 py-3.5 transition-colors',
    href && 'hover:bg-canvas focus-ring',
    className,
  )

  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/* ============================================================================
   Sparkline — 24px inline trend, no charting library
   ========================================================================== */

export function Sparkline({
  data,
  className,
  tone = 'currentColor',
}: {
  data: number[]
  className?: string
  tone?: string
}) {
  if (data.length < 2) return null
  const w = 80
  const h = 24
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = w / (data.length - 1)

  const points = data
    .map((d, i) => `${(i * step).toFixed(2)},${(h - ((d - min) / span) * (h - 2) - 1).toFixed(2)}`)
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('h-6 w-20 overflow-visible', className)}
      fill="none"
      aria-hidden
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        stroke={tone}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
