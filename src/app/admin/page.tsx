'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  CircleAlert,
  Clock,
  PackageX,
  RefreshCw,
  ShieldAlert,
  UserRoundCheck,
} from 'lucide-react'

import {
  Alert,
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
import { useAdminOverview } from '@/components/admin/shell/use-admin-counts'
import { formatCurrency } from '@/lib/currency'

/* ============================================================================
   Overview
   ----------------------------------------------------------------------------
   Rebuilt around one question: "what needs me right now?"

   The old version opened with four decorative cards and a placeholder that said
   a chart was coming soon. This one leads with the numbers, then immediately
   surfaces the work queue — every item links straight to the screen that
   resolves it. Nothing here is fabricated: every figure comes from
   GET /api/analytics/overview.
   ========================================================================== */

const nf = new Intl.NumberFormat('en-US')

export default function AdminOverviewPage() {
  const { data, isLoading, isError, refetch, isFetching } = useAdminOverview()

  const tasks = data ? buildTasks(data) : []

  return (
    <Page>
      <PageHeader
        title="نظرة عامة"
        description="حالة المنصة والعمليات التي تنتظر إجراءً."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              loading={isFetching && !isLoading}
              aria-label="تحديث البيانات"
            >
              <RefreshCw />
              تحديث
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/admin/orders">
                الطلبات
                <ArrowLeft className="rtl:rotate-180" />
              </Link>
            </Button>
          </>
        }
      />

      <PageBody>
        {isError ? (
          <ErrorState size="page" onRetry={() => refetch()} />
        ) : (
          <Stack gap="lg">
            {/* ---- Headline metrics ------------------------------------- */}
            {isLoading || !data ? (
              <StatRowSkeleton columns={4} />
            ) : (
              <StatRow columns={4}>
                <Stat
                  emphasis
                  label="صافي الإيرادات"
                  value={formatCurrency(data.revenue.netDelivered)}
                  hint={`من ${nf.format(data.revenue.deliveredOrderCount)} طلب مُسلَّم ومدفوع`}
                />
                <Stat
                  label="الطلبات"
                  value={nf.format(data.orders.total)}
                  hint={`${nf.format(data.orders.delivered)} مُسلَّم`}
                  href="/admin/orders"
                />
                <Stat
                  label="المنتجات النشطة"
                  value={nf.format(data.products.active)}
                  hint={`من إجمالي ${nf.format(data.products.total)}`}
                  href="/admin/products-advanced"
                />
                <Stat
                  label="التجار المعتمدون"
                  value={nf.format(data.merchants.approved)}
                  hint={`${nf.format(data.users.total)} مستخدم مسجَّل`}
                  href="/admin/stores"
                />
              </StatRow>
            )}

            {/* ---- Work queue ------------------------------------------- */}
            <Section
              title="يحتاج إلى إجراء"
              description="عناصر متوقفة على قرار من الإدارة."
              variant="panel"
              flush
            >
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
                  description="كل طلبات الانضمام والمدفوعات والمنتجات في وضع سليم."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {tasks.map((t) => (
                    <li key={t.href}>
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
              <Section title="حالة التجار" variant="panel">
                {data ? (
                  <Breakdown
                    total={
                      data.merchants.approved +
                      data.merchants.pending +
                      data.merchants.suspended +
                      data.merchants.rejected
                    }
                    segments={[
                      { label: 'معتمد', value: data.merchants.approved, className: 'bg-tone-success-fg' },
                      { label: 'قيد المراجعة', value: data.merchants.pending, className: 'bg-tone-warning-fg' },
                      { label: 'موقوف', value: data.merchants.suspended, className: 'bg-tone-danger-fg' },
                      { label: 'مرفوض', value: data.merchants.rejected, className: 'bg-tone-neutral-fg' },
                    ]}
                  />
                ) : (
                  <BreakdownSkeleton />
                )}
              </Section>

              <Section title="حالة المنتجات" variant="panel">
                {data ? (
                  <Breakdown
                    total={data.products.total}
                    segments={[
                      { label: 'منشور', value: data.products.active, className: 'bg-tone-success-fg' },
                      { label: 'غير منشور', value: data.products.inactive, className: 'bg-tone-neutral-fg' },
                    ]}
                  />
                ) : (
                  <BreakdownSkeleton />
                )}
              </Section>
            </div>

            <Alert tone="neutral" title="الرسوم البيانية الزمنية">
              لوحة الاتجاهات عبر الزمن تحتاج نقطة نهاية تُرجع سلاسل زمنية
              (إيرادات/طلبات يومية). حتى تتوفر، تعرض هذه الصفحة الأرقام الفعلية فقط
              بدل رسم بياني وهمي.
            </Alert>
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

function buildTasks(d: NonNullable<ReturnType<typeof useAdminOverview>['data']>): Task[] {
  const all: Task[] = [
    {
      href: '/admin/applications',
      title: 'طلبات انضمام قيد المراجعة',
      description: 'تجار ينتظرون الموافقة على متاجرهم',
      count: d.merchants.pending,
      icon: <UserRoundCheck className="size-3.5" />,
      chip: 'border-tone-warning-border bg-tone-warning-bg text-tone-warning-fg',
    },
    {
      href: '/admin/orders',
      title: 'طلبات بانتظار الدفع',
      description: 'لم يتم تأكيد الدفع بعد',
      count: d.orders.pendingPayment,
      icon: <Clock className="size-3.5" />,
      chip: 'border-tone-info-border bg-tone-info-bg text-tone-info-fg',
    },
    {
      href: '/admin/products-advanced',
      title: 'منتجات غير منشورة',
      description: 'مضافة لكنها غير ظاهرة للعملاء',
      count: d.products.inactive,
      icon: <PackageX className="size-3.5" />,
      chip: 'border-border bg-canvas text-text-muted',
    },
    {
      href: '/admin/stores',
      title: 'متاجر موقوفة',
      description: 'تحتاج مراجعة أو إعادة تفعيل',
      count: d.merchants.suspended,
      icon: <ShieldAlert className="size-3.5" />,
      chip: 'border-tone-danger-border bg-tone-danger-bg text-tone-danger-fg',
    },
    {
      href: '/admin/applications',
      title: 'طلبات مرفوضة',
      description: 'قد تحتاج متابعة أو إعادة تقديم',
      count: d.merchants.rejected,
      icon: <CircleAlert className="size-3.5" />,
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
    return <p className="py-4 text-center text-[12px] text-text-muted">لا توجد بيانات بعد</p>
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
