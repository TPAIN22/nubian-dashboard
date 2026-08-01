'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table2, BarChart3 } from 'lucide-react'

import { Button, SegmentedControl } from '@/components/admin/button'
import { EmptyState, ErrorState } from '@/components/admin/feedback'
import { Section } from '@/components/admin/page'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

/* ============================================================================
   Overview trend
   ----------------------------------------------------------------------------
   Two charts, one shared x-axis — deliberately NOT one chart with two y-axes.
   Orders (a count) and revenue (money) have unrelated scales; overlaying them
   on twin axes lets you slide one against the other until they "correlate",
   which is the single most misleading thing a dashboard can do.

   ── Colour ──────────────────────────────────────────────────────────────────
   The obvious choice — green "delivered" / red "cancelled" — was rejected on
   evidence, not taste: that pair measures ΔE 4.1 under deuteranopia, i.e. it is
   effectively one colour for red-green colourblind readers (~8% of men). The
   three hues below are the validated categorical slots; worst all-pairs CVD
   separation is ΔE 9.2 light / 9.4 dark, normal-vision 24.0 / 20.9.

   Aqua sits at 2.82:1 on the light surface, below the 3:1 bar. The relief for
   that is the table view toggle — every value is reachable without reading a
   colour at all.

   ── The revenue caveat is structural, not cosmetic ──────────────────────────
   The order model has no `paidAt` / `deliveredAt` (only `createdAt`,
   `updatedAt`, and a BANKAK-only approval stamp), so revenue cannot be bucketed
   by the day it was collected. It is bucketed by the day the order was *placed*,
   counting only orders that have since reached delivered + paid. That means the
   most recent days are still maturing and will keep rising. The chart shades
   that tail and says so, rather than letting an operator read it as a crash.
   ========================================================================== */

type Point = {
  date: string
  orders: number
  delivered: number
  cancelled: number
  pending: number
  revenue: number
}

type Series = {
  granularity: string
  timezone: string
  range: { days: number; from: string | null; to: string | null }
  revenueBasis: string
  maturityDays: number
  points: Point[]
  totals: { orders: number; delivered: number; cancelled: number; revenue: number }
}

/* -- palette ---------------------------------------------------------------- */
/* Validated categorical slots 3 / 1 / 2. Light and dark are separate selected
   steps, not an automatic flip. */
const SERIES = [
  { key: 'delivered', label: 'مُسلَّم', light: '#1baf7a', dark: '#199e70' },
  { key: 'inProgress', label: 'قيد التنفيذ', light: '#2a78d6', dark: '#3987e5' },
  { key: 'cancelled', label: 'ملغي', light: '#eb6834', dark: '#d95926' },
] as const

const RANGES = [
  { value: '7', label: '٧ أيام' },
  { value: '30', label: '٣٠ يوم' },
  { value: '90', label: '٩٠ يوم' },
] as const

async function fetchSeries(days: number): Promise<Series> {
  const res = await fetch(`/api/admin/analytics/timeseries?days=${days}`)
  if (!res.ok) throw new Error('failed to load timeseries')
  return res.json()
}

const dayFmt = new Intl.DateTimeFormat('ar-SD-u-nu-latn', { month: 'short', day: 'numeric' })
const fullFmt = new Intl.DateTimeFormat('ar-SD-u-nu-latn', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})
const numFmt = new Intl.NumberFormat('en-US')

/** Splits a point into the three stacked segments, which sum to `orders`. */
function segments(p: Point) {
  const inProgress = Math.max(0, p.orders - p.delivered - p.cancelled)
  return { delivered: p.delivered, inProgress, cancelled: p.cancelled }
}

export function OverviewTrend() {
  const [days, setDays] = React.useState<'7' | '30' | '90'>('30')
  const [view, setView] = React.useState<'chart' | 'table'>('chart')

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'timeseries', days],
    queryFn: () => fetchSeries(Number(days)),
    staleTime: 60_000,
  })

  return (
    <Section
      title="الاتجاه عبر الزمن"
      description="الطلبات اليومية حسب الحالة، والإيرادات المحققة منها."
      variant="panel"
      actions={
        // Filters sit in one row above the charts and scope both of them.
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={days}
            onValueChange={(v) => setDays(v as '7' | '30' | '90')}
            options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={view === 'chart' ? 'عرض كجدول' : 'عرض كرسم بياني'}
            title={view === 'chart' ? 'عرض كجدول' : 'عرض كرسم بياني'}
            onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
          >
            {view === 'chart' ? <Table2 /> : <BarChart3 />}
          </Button>
        </div>
      }
    >
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <ChartSkeleton />
      ) : data.totals.orders === 0 ? (
        <EmptyState
          title="لا توجد طلبات في هذه الفترة"
          description="جرّب نطاقاً زمنياً أوسع، أو انتظر ورود أول طلب."
        />
      ) : view === 'table' ? (
        <SeriesTable data={data} />
      ) : (
        // Refetch keeps the frame: the previous render dims rather than
        // collapsing to a skeleton, so the panel never jumps.
        <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
          <Charts data={data} />
        </div>
      )}
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Charts                                                                     */
/* -------------------------------------------------------------------------- */

function Charts({ data }: { data: Series }) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(880)
  const [hover, setHover] = React.useState<number | null>(null)

  // Real pixel width, so the 24px bar cap and 2px gaps are actual sizes rather
  // than viewBox units that scale with the container.
  React.useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(320, entry.contentRect.width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const points = data.points
  const n = points.length
  const PAD_S = 44 // inline-start gutter for y ticks
  const PAD_E = 8
  const plotW = Math.max(80, width - PAD_S - PAD_E)
  const band = plotW / n
  const barW = Math.min(24, Math.max(3, band - 4))

  const maxOrders = Math.max(1, ...points.map((p) => p.orders))
  const maxRevenue = Math.max(1, ...points.map((p) => p.revenue))

  const ordersH = 132
  const revenueH = 92

  // Index of the first day inside the maturing tail — revenue after this point
  // is still incomplete and is drawn as such.
  const maturingFrom = Math.max(0, n - data.maturityDays)

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // RTL: the plot is laid out left-to-right in SVG space regardless of
    // document direction, so measure from the element's left edge.
    const x = e.clientX - rect.left - PAD_S
    const i = Math.floor(x / band)
    setHover(i >= 0 && i < n ? i : null)
  }

  const active = hover != null ? points[hover] : null

  return (
    <div ref={wrapRef} className="relative">
      <Legend />

      <div
        className="relative"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {/* ---- Orders: stacked columns ---------------------------------- */}
        <svg
          width="100%"
          height={ordersH + 18}
          viewBox={`0 0 ${width} ${ordersH + 18}`}
          role="img"
          aria-label="الطلبات اليومية حسب الحالة"
          className="block overflow-visible"
        >
          <YAxis max={maxOrders} height={ordersH} padStart={PAD_S} width={width} />

          {points.map((p, i) => {
            const seg = segments(p)
            const x = PAD_S + i * band + (band - barW) / 2
            let cursor = ordersH
            const stack = [
              { v: seg.delivered, c: 0 },
              { v: seg.inProgress, c: 1 },
              { v: seg.cancelled, c: 2 },
            ].filter((s) => s.v > 0)

            return (
              <g key={p.date} opacity={hover == null || hover === i ? 1 : 0.45}>
                {stack.map((s, si) => {
                  const h = (s.v / maxOrders) * ordersH
                  const isTop = si === stack.length - 1
                  // 2px surface gap between touching segments — negative space,
                  // never a stroke. The gap belongs above each segment except
                  // the topmost, which must reach the true value.
                  const gap = isTop ? 0 : 2
                  const drawn = Math.max(1, h - gap)
                  cursor -= h
                  return (
                    <path
                      key={s.c}
                      // Only the data-end is rounded; the baseline end stays
                      // square. `rx` on a <rect> would round all four corners.
                      d={capRoundedBar(x, cursor + gap, barW, drawn, isTop ? 4 : 0)}
                      className={`viz-fill-${s.c}`}
                    />
                  )
                })}
              </g>
            )
          })}

          {hover != null && (
            <rect
              x={PAD_S + hover * band}
              y={0}
              width={band}
              height={ordersH}
              className="fill-foreground/[0.04]"
              pointerEvents="none"
            />
          )}
        </svg>

        <p className="mt-1 mb-2 text-[11px] font-medium text-text-muted">
          الإيرادات المحققة{' '}
          <span className="font-normal text-text-faint">
            — من طلبات ذلك اليوم التي اكتمل تسليمها ودفعها
          </span>
        </p>

        {/* ---- Revenue: line + wash -------------------------------------- */}
        <svg
          width="100%"
          height={revenueH + 18}
          viewBox={`0 0 ${width} ${revenueH + 18}`}
          role="img"
          aria-label="الإيرادات اليومية المحققة"
          className="block overflow-visible"
        >
          <YAxis
            max={maxRevenue}
            height={revenueH}
            padStart={PAD_S}
            width={width}
            money
          />

          {/* Maturing tail: shaded, because these values are still climbing. */}
          {maturingFrom < n - 1 && (
            <rect
              x={PAD_S + maturingFrom * band}
              y={0}
              width={(n - maturingFrom) * band}
              height={revenueH}
              className="fill-foreground/[0.05]"
            />
          )}

          <path
            d={areaPath(points, maxRevenue, PAD_S, band, revenueH)}
            className="viz-fill-0"
            opacity={0.1}
          />
          <path
            d={linePath(points, maxRevenue, PAD_S, band, revenueH)}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="viz-stroke-0"
          />

          {hover != null && points[hover] && (
            <>
              <line
                x1={PAD_S + hover * band + band / 2}
                x2={PAD_S + hover * band + band / 2}
                y1={0}
                y2={revenueH}
                className="stroke-border-strong"
                strokeWidth={1}
              />
              <circle
                cx={PAD_S + hover * band + band / 2}
                cy={revenueH - (points[hover].revenue / maxRevenue) * revenueH}
                r={4}
                className="viz-fill-0 stroke-card"
                strokeWidth={2}
              />
            </>
          )}
        </svg>

        {/* ---- X labels --------------------------------------------------- */}
        <div
          className="relative mt-1 h-4"
          style={{ marginInlineStart: PAD_S, width: plotW }}
        >
          {points.map((p, i) =>
            i % Math.ceil(n / 6) === 0 ? (
              <span
                key={p.date}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px] text-text-faint nums"
                style={{ left: i * band + band / 2 }}
              >
                {dayFmt.format(new Date(`${p.date}T00:00:00`))}
              </span>
            ) : null,
          )}
        </div>

        {active && <Tooltip point={active} index={hover as number} band={band} padStart={PAD_S} maturing={(hover as number) >= maturingFrom} />}
      </div>

      <p className="mt-3 text-[11px] leading-4 text-text-faint">
        آخر {data.maturityDays} أيام مظللة في رسم الإيرادات: طلباتها لم تكتمل بعد، وقيمتها
        سترتفع مع اكتمال التسليم والدفع — لا تقرأها كانخفاض.
      </p>

      <VizPalette />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * A column with only its top two corners rounded — the "4px rounded data-end,
 * square at the baseline" spec. Degrades to a plain rect when the segment is
 * shorter than the radius, so tiny values don't turn into lozenges.
 */
function capRoundedBar(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h)
  if (radius <= 0) return `M${x},${y}h${w}v${h}h${-w}Z`
  return [
    `M${x},${y + h}`,
    `V${y + radius}`,
    `a${radius},${radius} 0 0 1 ${radius},${-radius}`,
    `h${w - radius * 2}`,
    `a${radius},${radius} 0 0 1 ${radius},${radius}`,
    `V${y + h}`,
    'Z',
  ].join(' ')
}

function areaPath(pts: Point[], max: number, padS: number, band: number, h: number) {
  const line = pts
    .map((p, i) => `${padS + i * band + band / 2},${h - (p.revenue / max) * h}`)
    .join(' L ')
  const firstX = padS + band / 2
  const lastX = padS + (pts.length - 1) * band + band / 2
  return `M ${firstX},${h} L ${line} L ${lastX},${h} Z`
}

function linePath(pts: Point[], max: number, padS: number, band: number, h: number) {
  return `M ${pts
    .map((p, i) => `${padS + i * band + band / 2},${h - (p.revenue / max) * h}`)
    .join(' L ')}`
}

function YAxis({
  max,
  height,
  padStart,
  width,
  money,
}: {
  max: number
  height: number
  padStart: number
  width: number
  money?: boolean
}) {
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f))
  return (
    <g>
      {ticks.map((t, i) => {
        const y = height - (t / max) * height
        return (
          <g key={i}>
            <line
              x1={padStart}
              x2={width}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={padStart - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-text-faint text-[10px] nums"
            >
              {money ? shortMoney(t) : numFmt.format(t)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function shortMoney(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return numFmt.format(n)
}

function Legend() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
      {SERIES.map((s, i) => (
        <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <span className={`size-2 rounded-[2px] viz-fill-bg-${i}`} aria-hidden />
          {s.label}
        </span>
      ))}
    </div>
  )
}

function Tooltip({
  point,
  index,
  band,
  padStart,
  maturing,
}: {
  point: Point
  index: number
  band: number
  padStart: number
  maturing: boolean
}) {
  const seg = segments(point)
  const rows = [
    { label: 'مُسلَّم', value: numFmt.format(seg.delivered), i: 0 },
    { label: 'قيد التنفيذ', value: numFmt.format(seg.inProgress), i: 1 },
    { label: 'ملغي', value: numFmt.format(seg.cancelled), i: 2 },
  ]

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute top-0 z-10 w-44 rounded-lg border border-border bg-popover p-2.5"
      style={{
        left: padStart + index * band + band / 2,
        transform: 'translateX(-50%)',
        boxShadow: 'var(--elev-menu)',
      }}
    >
      <p className="mb-1.5 text-[11px] font-medium text-foreground">
        {fullFmt.format(new Date(`${point.date}T00:00:00`))}
      </p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-3 py-px">
          <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className={`h-0.5 w-2.5 rounded-full viz-fill-bg-${r.i}`} aria-hidden />
            {r.label}
          </span>
          <span className="text-[11px] font-semibold text-foreground nums">{r.value}</span>
        </p>
      ))}
      <p className="mt-1.5 flex items-center justify-between gap-3 border-t border-border pt-1.5">
        <span className="text-[11px] text-text-muted">الإيرادات</span>
        <span className="text-[11px] font-semibold text-foreground nums">
          {formatCurrency(point.revenue)}
        </span>
      </p>
      {maturing && (
        <p className="mt-1 text-[10px] leading-3 text-text-faint">قيمة غير مكتملة بعد</p>
      )}
    </div>
  )
}

function SeriesTable({ data }: { data: Series }) {
  return (
    <div className="max-h-80 overflow-y-auto quiet-scroll">
      <table className="w-full text-[12px]">
        <thead className="sticky top-0 bg-canvas text-text-muted">
          <tr className="border-b border-border">
            <th className="h-8 px-2 text-start text-[11px] font-medium">اليوم</th>
            <th className="h-8 px-2 text-end text-[11px] font-medium">مُسلَّم</th>
            <th className="h-8 px-2 text-end text-[11px] font-medium">قيد التنفيذ</th>
            <th className="h-8 px-2 text-end text-[11px] font-medium">ملغي</th>
            <th className="h-8 px-2 text-end text-[11px] font-medium">الإجمالي</th>
            <th className="h-8 px-2 text-end text-[11px] font-medium">الإيرادات</th>
          </tr>
        </thead>
        <tbody>
          {data.points.map((p) => {
            const seg = segments(p)
            return (
              <tr key={p.date} className="border-b border-border">
                <td className="h-7 px-2 whitespace-nowrap text-text-muted nums">
                  {dayFmt.format(new Date(`${p.date}T00:00:00`))}
                </td>
                <td className="h-7 px-2 text-end nums">{numFmt.format(seg.delivered)}</td>
                <td className="h-7 px-2 text-end nums">{numFmt.format(seg.inProgress)}</td>
                <td className="h-7 px-2 text-end nums">{numFmt.format(seg.cancelled)}</td>
                <td className="h-7 px-2 text-end font-medium nums">
                  {numFmt.format(p.orders)}
                </td>
                <td className="h-7 px-2 text-end nums">{formatCurrency(p.revenue)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-40 animate-pulse rounded bg-canvas-hover" />
      <div className="animate-pulse rounded bg-canvas-hover" style={{ height: 132 }} />
      <div className="animate-pulse rounded bg-canvas-hover" style={{ height: 92 }} />
    </div>
  )
}

/**
 * Series colours as scoped custom properties.
 *
 * Kept out of the Tailwind theme on purpose: these are chart-surface colours
 * validated against this panel's background, not general UI tokens, and they
 * must not become available as `bg-*` utilities elsewhere. Dark steps are
 * separately chosen values under the app's `.dark` class — not a filter flip.
 */
function VizPalette() {
  return (
    <style>{`
      .viz-fill-0 { fill: ${SERIES[0].light}; }
      .viz-fill-1 { fill: ${SERIES[1].light}; }
      .viz-fill-2 { fill: ${SERIES[2].light}; }
      .viz-stroke-0 { stroke: ${SERIES[0].light}; }
      .viz-fill-bg-0 { background-color: ${SERIES[0].light}; }
      .viz-fill-bg-1 { background-color: ${SERIES[1].light}; }
      .viz-fill-bg-2 { background-color: ${SERIES[2].light}; }
      .dark .viz-fill-0 { fill: ${SERIES[0].dark}; }
      .dark .viz-fill-1 { fill: ${SERIES[1].dark}; }
      .dark .viz-fill-2 { fill: ${SERIES[2].dark}; }
      .dark .viz-stroke-0 { stroke: ${SERIES[0].dark}; }
      .dark .viz-fill-bg-0 { background-color: ${SERIES[0].dark}; }
      .dark .viz-fill-bg-1 { background-color: ${SERIES[1].dark}; }
      .dark .viz-fill-bg-2 { background-color: ${SERIES[2].dark}; }
    `}</style>
  )
}
