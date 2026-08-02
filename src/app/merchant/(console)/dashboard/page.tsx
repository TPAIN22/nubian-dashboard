'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, PackageX, RefreshCw, Truck } from 'lucide-react'

import {
  Button,
  EmptyState,
  ErrorState,
  Page,
  PageBody,
  PageHeader,
  Section,
  Stack,
  Stat,
  StatRow,
  StatRowSkeleton,
} from '@/components/admin'
import { formatCurrency } from '@/lib/currency'
import { useMerchantProducts, useMerchantStats, useMerchantStatus } from '@/features/merchant/api'

/* ============================================================================
   Merchant overview
   ----------------------------------------------------------------------------
   Rebuilt around the same question the admin overview answers: "what needs me
   right now?"

   The old version opened with four decorative cards, then two cards that just
   listed every status with its count, then a card of three buttons duplicating
   the sidebar. This one leads with the numbers, then surfaces the work queue —
   every row links straight to the screen that clears it.
   ========================================================================== */

const nf = new Intl.NumberFormat('en-US')

export default function MerchantOverviewPage() {
  const router = useRouter()
  const status = useMerchantStatus()
  const stats = useMerchantStats()
  const products = useMerchantProducts()

  const store = status.data?.application
  const storeName = store?.storeName || store?.businessName

  // The middleware is the real gate, but Clerk claims can lag behind an admin
  // suspending a store mid-session. Trust the record, not the JWT.
  React.useEffect(() => {
    if (!status.data) return
    if (!status.data.hasApplication) {
      router.replace('/merchant/apply')
      return
    }
    if (store && store.status?.toUpperCase() !== 'APPROVED') {
      router.replace('/merchant/pending')
    }
  }, [status.data, store, router])

  const isLoading = stats.isLoading || products.isLoading
  const isError = stats.isError && products.isError

  const refresh = () => {
    stats.refetch()
    products.refetch()
  }

  const productList = React.useMemo(() => products.data ?? [], [products.data])
  const outOfStock = productList.filter((p) => (p.stock ?? 0) <= 0).length
  const lowStock = productList.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 10).length
  const unpublished = productList.filter((p) => !p.isActive).length

  const tasks = buildTasks({
    pendingOrders: stats.data?.statusStats.pending ?? 0,
    confirmedOrders: stats.data?.statusStats.confirmed ?? 0,
    outOfStock,
    lowStock,
    unpublished,
  })

  return (
    <Page>
      <PageHeader
        title="نظرة عامة"
        description={
          storeName ? `أهلاً بعودتك — ${storeName}` : 'حالة متجرك والعمليات التي تنتظر إجراءً.'
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              loading={(stats.isFetching || products.isFetching) && !isLoading}
              aria-label="تحديث البيانات"
            >
              <RefreshCw />
              تحديث
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/merchant/orders">
                الطلبات
                <ArrowLeft className="rtl:rotate-180" />
              </Link>
            </Button>
          </>
        }
      />

      <PageBody>
        {isError ? (
          <ErrorState size="page" onRetry={refresh} />
        ) : (
          <Stack gap="lg">
            {/* ---- Headline metrics ------------------------------------- */}
            {isLoading ? (
              <StatRowSkeleton columns={4} />
            ) : (
              <StatRow columns={4}>
                <Stat
                  emphasis
                  label="الإيرادات المحصّلة"
                  value={formatCurrency(stats.data?.revenueByStatus.delivered ?? 0)}
                  hint={`من ${nf.format(stats.data?.statusStats.delivered ?? 0)} طلب مُسلَّم`}
                />
                <Stat
                  label="إجمالي الطلبات"
                  value={nf.format(stats.data?.totalOrders ?? 0)}
                  hint={`${nf.format(stats.data?.statusStats.pending ?? 0)} بانتظار التأكيد`}
                  href="/merchant/orders"
                />
                <Stat
                  label="المنتجات المنشورة"
                  value={nf.format(productList.filter((p) => p.isActive).length)}
                  hint={`من إجمالي ${nf.format(productList.length)}`}
                  href="/merchant/products"
                />
                <Stat
                  label="إيرادات قيد التحصيل"
                  value={formatCurrency(
                    (stats.data?.revenueByStatus.pending ?? 0) +
                      (stats.data?.revenueByStatus.confirmed ?? 0) +
                      (stats.data?.revenueByStatus.shipped ?? 0),
                  )}
                  hint="طلبات لم تُسلَّم بعد"
                  href="/merchant/orders"
                />
              </StatRow>
            )}

            {/* ---- Work queue ------------------------------------------- */}
            <Section title="يحتاج إلى إجراء" description="عناصر متوقفة عليك." variant="panel" flush>
              {isLoading ? (
                <div className="divide-y divide-border">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="size-7 animate-pulse rounded-md bg-canvas-hover" />
                      <div className="flex-1">
                        <div className="h-3 w-40 animate-pulse rounded bg-canvas-hover" />
                        <div className="mt-1.5 h-2.5 w-56 animate-pulse rounded bg-canvas-hover" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <EmptyState
                  title="لا شيء ينتظر إجراءً"
                  description="كل الطلبات مُعالَجة ومخزونك في وضع سليم."
                  action={
                    <Button variant="secondary" size="sm" asChild>
                      <Link href="/merchant/products/new">إضافة منتج</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {tasks.map((t) => (
                    <li key={t.title}>
                      <Link
                        href={t.href}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-canvas focus-ring"
                      >
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-[6px] border ${t.chip}`}
                        >
                          {t.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-foreground">
                            {t.title}
                          </span>
                          <span className="block truncate text-[12px] text-text-muted">
                            {t.description}
                          </span>
                        </span>
                        <span className="shrink-0 text-[15px] font-semibold text-foreground nums">
                          {nf.format(t.count)}
                        </span>
                        <ArrowLeft className="size-3.5 shrink-0 text-text-faint rtl:rotate-180" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* ---- Breakdowns -------------------------------------------- */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Section
                title="الطلبات حسب الحالة"
                description="توزيع كل طلباتك على مراحل التنفيذ."
                variant="panel"
              >
                {stats.data ? (
                  <Breakdown
                    total={stats.data.totalOrders}
                    segments={[
                      {
                        label: 'بانتظار التأكيد',
                        value: stats.data.statusStats.pending,
                        className: 'bg-tone-warning-fg',
                      },
                      {
                        label: 'مؤكد',
                        value: stats.data.statusStats.confirmed,
                        className: 'bg-tone-info-fg',
                      },
                      {
                        label: 'تم الشحن',
                        value: stats.data.statusStats.shipped,
                        className: 'bg-brand',
                      },
                      {
                        label: 'تم التسليم',
                        value: stats.data.statusStats.delivered,
                        className: 'bg-tone-success-fg',
                      },
                      {
                        label: 'ملغي',
                        value: stats.data.statusStats.cancelled,
                        className: 'bg-tone-danger-fg',
                      },
                    ]}
                  />
                ) : (
                  <BreakdownSkeleton />
                )}
              </Section>

              <Section
                title="الإيرادات حسب الحالة"
                description="متى يتحوّل كل مبلغ إلى نقد."
                variant="panel"
              >
                {stats.data ? (
                  <dl className="divide-y divide-border">
                    {(
                      [
                        [
                          'تم التسليم',
                          stats.data.revenueByStatus.delivered,
                          'text-tone-success-fg',
                        ],
                        ['تم الشحن', stats.data.revenueByStatus.shipped, 'text-foreground'],
                        ['مؤكد', stats.data.revenueByStatus.confirmed, 'text-foreground'],
                        ['بانتظار التأكيد', stats.data.revenueByStatus.pending, 'text-text-muted'],
                      ] as const
                    ).map(([label, value, tone]) => (
                      <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                        <dt className="text-[12px] text-text-muted">{label}</dt>
                        <dd className={`text-[13px] font-medium nums ${tone}`}>
                          {formatCurrency(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <BreakdownSkeleton />
                )}
              </Section>
            </div>
          </Stack>
        )}
      </PageBody>
    </Page>
  )
}

/* -------------------------------------------------------------------------- */
/* Work queue                                                                 */
/* -------------------------------------------------------------------------- */

type Task = {
  href: string
  title: string
  description: string
  count: number
  icon: React.ReactNode
  chip: string
}

function buildTasks(d: {
  pendingOrders: number
  confirmedOrders: number
  outOfStock: number
  lowStock: number
  unpublished: number
}): Task[] {
  const all: Task[] = [
    {
      href: '/merchant/orders?status=pending',
      title: 'طلبات بانتظار التأكيد',
      description: 'العميل ينتظر ردك قبل التجهيز',
      count: d.pendingOrders,
      icon: <Clock className="size-3.5" />,
      chip: 'border-tone-warning-border bg-tone-warning-bg text-tone-warning-fg',
    },
    {
      href: '/merchant/orders?status=confirmed',
      title: 'طلبات جاهزة للشحن',
      description: 'مؤكدة ولم تُشحن بعد',
      count: d.confirmedOrders,
      icon: <Truck className="size-3.5" />,
      chip: 'border-tone-info-border bg-tone-info-bg text-tone-info-fg',
    },
    {
      href: '/merchant/products',
      title: 'منتجات نفد مخزونها',
      description: 'لا يمكن للعملاء شراؤها الآن',
      count: d.outOfStock,
      icon: <PackageX className="size-3.5" />,
      chip: 'border-tone-danger-border bg-tone-danger-bg text-tone-danger-fg',
    },
    {
      href: '/merchant/products',
      title: 'منتجات مخزونها منخفض',
      description: 'أقل من 10 قطع متبقية',
      count: d.lowStock,
      icon: <PackageX className="size-3.5" />,
      chip: 'border-tone-warning-border bg-tone-warning-bg text-tone-warning-fg',
    },
    {
      href: '/merchant/products',
      title: 'منتجات غير منشورة',
      description: 'مضافة لكنها غير ظاهرة للعملاء',
      count: d.unpublished,
      icon: <PackageX className="size-3.5" />,
      chip: 'border-border bg-canvas text-text-muted',
    },
  ]

  // Only surface what actually needs work, most urgent first.
  return all.filter((t) => t.count > 0).sort((a, b) => b.count - a.count)
}

/* -------------------------------------------------------------------------- */
/* Breakdown bar                                                              */
/* -------------------------------------------------------------------------- */

function Breakdown({
  total,
  segments,
}: {
  total: number
  segments: { label: string; value: number; className: string }[]
}) {
  const shown = segments.filter((s) => s.value > 0)

  if (total === 0) {
    return <p className="py-4 text-center text-[12px] text-text-muted">لا توجد طلبات بعد</p>
  }

  return (
    <div>
      <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-canvas-hover">
        {shown.map((s) => (
          <div
            key={s.label}
            className={s.className}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <dt className="flex min-w-0 items-center gap-1.5 text-[12px] text-text-muted">
              <span className={`size-1.5 shrink-0 rounded-full ${s.className}`} aria-hidden />
              <span className="truncate">{s.label}</span>
            </dt>
            <dd className="shrink-0 text-[12px] font-medium text-foreground nums">
              {nf.format(s.value)}
              <span className="ms-1 text-[11px] font-normal text-text-faint">
                {total > 0 ? `${Math.round((s.value / total) * 100)}%` : '—'}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function BreakdownSkeleton() {
  return (
    <div>
      <div className="h-1.5 w-full animate-pulse rounded-full bg-canvas-hover" />
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-3 animate-pulse rounded bg-canvas-hover" />
        ))}
      </div>
    </div>
  )
}
