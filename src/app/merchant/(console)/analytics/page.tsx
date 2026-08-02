'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

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
  StatusBadge,
  DataTable,
  CellTitle,
  type Column,
} from '@/components/admin'
import { formatCurrency } from '@/lib/currency'
import {
  useMerchantProducts,
  useMerchantStats,
  type MerchantProduct,
} from '@/features/merchant/api'
import { categoryName, sellingPrice } from '../products/productsTable'

/* ============================================================================
   Analytics
   ----------------------------------------------------------------------------
   The old page rendered the same four numbers and the same two status lists as
   the dashboard — two routes showing one screen. This one answers the questions
   the overview does not: how efficiently orders convert to cash, and which part
   of the catalogue is carrying (or blocking) the store.

   Everything here is derived from the two aggregates the API actually exposes.
   Nothing is estimated, and no metric is shown that cannot be computed from
   real data.
   ========================================================================== */

const nf = new Intl.NumberFormat('en-US')
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0)

export default function MerchantAnalyticsPage() {
  const stats = useMerchantStats()
  const products = useMerchantProducts()

  const isLoading = stats.isLoading || products.isLoading
  const refresh = () => {
    stats.refetch()
    products.refetch()
  }

  const s = stats.data
  const list = React.useMemo(() => products.data?.items ?? [], [products.data])

  const fulfilled = s?.statusStats.delivered ?? 0
  const cancelled = s?.statusStats.cancelled ?? 0
  const totalOrders = s?.totalOrders ?? 0
  const collected = s?.revenueByStatus.delivered ?? 0
  const inFlight =
    (s?.revenueByStatus.pending ?? 0) +
    (s?.revenueByStatus.confirmed ?? 0) +
    (s?.revenueByStatus.shipped ?? 0)

  // Average order value is only meaningful over orders that actually completed.
  const aov = fulfilled > 0 ? collected / fulfilled : 0

  const inventoryValue = list.reduce((sum, p) => sum + sellingPrice(p) * (p.stock ?? 0), 0)

  return (
    <Page>
      <PageHeader
        title="التحليلات"
        description="كفاءة التنفيذ وحالة الكتالوج."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              loading={(stats.isFetching || products.isFetching) && !isLoading}
              aria-label="تحديث"
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
        {stats.isError && products.isError ? (
          <ErrorState
            size="page"
            description={((stats.error ?? products.error) as Error | null)?.message}
            onRetry={refresh}
          />
        ) : (
          <Stack gap="lg">
            {isLoading ? (
              <StatRowSkeleton columns={4} />
            ) : (
              <StatRow columns={4}>
                <Stat
                  emphasis
                  label="متوسط قيمة الطلب"
                  value={formatCurrency(aov)}
                  hint={`محسوب على ${nf.format(fulfilled)} طلب مُسلَّم`}
                />
                <Stat
                  label="معدل الإتمام"
                  value={`${pct(fulfilled, totalOrders).toFixed(1)}%`}
                  hint={`${nf.format(fulfilled)} من ${nf.format(totalOrders)} طلب`}
                />
                <Stat
                  label="معدل الإلغاء"
                  value={`${pct(cancelled, totalOrders).toFixed(1)}%`}
                  hint={`${nf.format(cancelled)} طلب ملغي`}
                />
                <Stat
                  label="قيمة المخزون"
                  value={formatCurrency(inventoryValue)}
                  hint={`${nf.format(list.reduce((n, p) => n + (p.stock ?? 0), 0))} قطعة متاحة`}
                  href="/merchant/products"
                />
              </StatRow>
            )}

            {/* ---- Funnel ------------------------------------------------ */}
            <Section
              title="مسار تنفيذ الطلبات"
              description="أين تتوقف طلباتك، ونسبة كل مرحلة من الإجمالي."
              variant="panel"
            >
              {!s || totalOrders === 0 ? (
                <EmptyState
                  title="لا توجد طلبات بعد"
                  description="سيظهر مسار التنفيذ فور وصول أول طلب."
                />
              ) : (
                <div className="space-y-2.5">
                  {(
                    [
                      ['بانتظار التأكيد', s.statusStats.pending, 'bg-tone-warning-fg'],
                      ['مؤكد', s.statusStats.confirmed, 'bg-tone-info-fg'],
                      ['تم الشحن', s.statusStats.shipped, 'bg-brand'],
                      ['تم التسليم', s.statusStats.delivered, 'bg-tone-success-fg'],
                      ['ملغي', s.statusStats.cancelled, 'bg-tone-danger-fg'],
                    ] as const
                  ).map(([label, value, bar]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3"
                    >
                      <span className="truncate text-[12px] text-text-muted">{label}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-canvas-hover">
                        <span
                          className={`block h-full rounded-full ${bar}`}
                          style={{ width: `${pct(value, totalOrders)}%` }}
                        />
                      </span>
                      <span className="text-[12px] font-medium text-foreground nums">
                        {nf.format(value)}
                        <span className="ms-1.5 text-[11px] font-normal text-text-faint">
                          {pct(value, totalOrders).toFixed(0)}%
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* ---- Cash position ----------------------------------------- */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Section
                title="وضع التحصيل"
                description="ما وصلك فعلاً مقابل ما لا يزال في الطريق."
                variant="panel"
              >
                <dl className="divide-y divide-border">
                  <Row
                    label="محصَّل (طلبات مُسلَّمة)"
                    value={formatCurrency(collected)}
                    tone="text-tone-success-fg"
                  />
                  <Row
                    label="قيد التحصيل"
                    value={formatCurrency(inFlight)}
                    tone="text-foreground"
                  />
                  <Row
                    label="ملغي"
                    value={formatCurrency(s?.revenueByStatus.cancelled ?? 0)}
                    tone="text-text-muted"
                  />
                </dl>
              </Section>

              <Section
                title="صحة الكتالوج"
                description="ما يمنع منتجاتك من البيع الآن."
                variant="panel"
              >
                <dl className="divide-y divide-border">
                  <Row
                    label="منشور ومتوفر"
                    value={nf.format(list.filter((p) => p.isActive && (p.stock ?? 0) > 0).length)}
                    tone="text-tone-success-fg"
                  />
                  <Row
                    label="منشور لكن نفد مخزونه"
                    value={nf.format(list.filter((p) => p.isActive && (p.stock ?? 0) <= 0).length)}
                    tone="text-tone-danger-fg"
                  />
                  <Row
                    label="غير منشور"
                    value={nf.format(list.filter((p) => !p.isActive).length)}
                    tone="text-text-muted"
                  />
                </dl>
              </Section>
            </div>

            {/* ---- Inventory concentration -------------------------------- */}
            <Section
              title="أعلى المنتجات قيمة في المخزون"
              description="السعر × الكمية المتاحة — أين رأس مالك محبوس."
              variant="panel"
              flush
              actions={
                <Button variant="ghost" size="xs" asChild>
                  <Link href="/merchant/products">كل المنتجات</Link>
                </Button>
              }
            >
              <TopInventory products={list} loading={products.isLoading} />
            </Section>
          </Stack>
        )}
      </PageBody>
    </Page>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-[12px] text-text-muted">{label}</dt>
      <dd className={`text-[13px] font-medium nums ${tone}`}>{value}</dd>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const inventoryColumns: Column<MerchantProduct>[] = [
  {
    id: 'name',
    header: 'المنتج',
    hideable: false,
    cell: (p) => <CellTitle title={p.name} subtitle={categoryName(p.category) || 'بدون تصنيف'} />,
  },
  {
    id: 'status',
    header: 'الحالة',
    width: '110px',
    truncate: false,
    cell: (p) => (
      <StatusBadge
        tone={p.isActive ? 'success' : 'neutral'}
        label={p.isActive ? 'منشور' : 'غير منشور'}
      />
    ),
  },
  {
    id: 'stock',
    header: 'المتاح',
    width: '80px',
    align: 'end',
    cell: (p) => p.stock ?? 0,
  },
  {
    id: 'value',
    header: 'قيمة المخزون',
    width: '140px',
    align: 'end',
    cell: (p) => (
      <span className="font-medium">{formatCurrency(sellingPrice(p) * (p.stock ?? 0))}</span>
    ),
  },
]

function TopInventory({ products, loading }: { products: MerchantProduct[]; loading: boolean }) {
  const top = React.useMemo(
    () =>
      [...products]
        .filter((p) => (p.stock ?? 0) > 0)
        .sort((a, b) => sellingPrice(b) * (b.stock ?? 0) - sellingPrice(a) * (a.stock ?? 0))
        .slice(0, 8),
    [products],
  )

  return (
    <DataTable
      data={top}
      columns={inventoryColumns}
      getRowId={(p) => p._id}
      loading={loading}
      skeletonRows={5}
      stickyHeader={false}
      empty={
        <EmptyState
          title="لا يوجد مخزون متاح"
          description="أضف كميات لمنتجاتك ليظهر توزيع قيمة المخزون هنا."
        />
      }
    />
  )
}
