'use client'

import * as React from 'react'
import { Gift, RefreshCw } from 'lucide-react'

import {
  Alert,
  Button,
  CellEmpty,
  Code,
  DataTable,
  EmptyState,
  ErrorState,
  Page,
  PageBody,
  PageHeader,
  SearchInput,
  Section,
  Stack,
  Stat,
  StatRow,
  StatRowSkeleton,
  StatusBadge,
  Toolbar,
  ToolbarSpacer,
  ViewTabs,
  useColumnVisibility,
  type Column,
} from '@/components/admin'
import { formatCurrency } from '@/lib/currency'
import { useMerchantCoupons, type MerchantCoupon } from '@/features/merchant/api'

/* ============================================================================
   Coupons
   ----------------------------------------------------------------------------
   Read-only by design: coupons that touch a merchant's catalogue are created by
   the platform, not the merchant. The page's job is to explain what each one is
   costing and earning, which the old four-card summary never did — it reported
   totals with no way to see which coupon they came from.
   ========================================================================== */

const nf = new Intl.NumberFormat('en-US')

const isExpired = (c: MerchantCoupon) => new Date(c.endDate) < new Date()
const isLive = (c: MerchantCoupon) => {
  const now = new Date()
  return c.isActive && new Date(c.startDate) <= now && new Date(c.endDate) >= now
}

function couponState(c: MerchantCoupon): { tone: 'success' | 'danger' | 'neutral'; label: string } {
  if (isExpired(c)) return { tone: 'danger', label: 'منتهي' }
  if (isLive(c)) return { tone: 'success', label: 'نشط' }
  if (c.isActive) return { tone: 'neutral', label: 'لم يبدأ' }
  return { tone: 'neutral', label: 'معطل' }
}

const columns: Column<MerchantCoupon>[] = [
  {
    id: 'code',
    header: 'الكود',
    width: '150px',
    hideable: false,
    cell: (c) => <Code className="font-semibold text-foreground">{c.code}</Code>,
  },
  {
    id: 'value',
    header: 'الخصم',
    width: '110px',
    cell: (c) =>
      c.type === 'percentage' ? (
        <span className="font-medium nums">{c.value}%</span>
      ) : (
        <span className="font-medium nums">{formatCurrency(c.value)}</span>
      ),
  },
  {
    id: 'minOrder',
    header: 'الحد الأدنى',
    width: '120px',
    align: 'end',
    cell: (c) => (c.minOrderAmount > 0 ? formatCurrency(c.minOrderAmount) : <CellEmpty />),
  },
  {
    id: 'usage',
    header: 'الاستخدام',
    width: '110px',
    align: 'end',
    cell: (c) => (
      <span className="nums">
        {nf.format(c.usageCount || 0)}
        <span className="text-text-faint">
          {' '}
          / {c.usageLimitGlobal ? nf.format(c.usageLimitGlobal) : '∞'}
        </span>
      </span>
    ),
  },
  {
    id: 'orders',
    header: 'الطلبات',
    width: '90px',
    align: 'end',
    cell: (c) => nf.format(c.totalOrders || 0),
  },
  {
    id: 'discount',
    header: 'الخصومات الممنوحة',
    width: '150px',
    align: 'end',
    cell: (c) => (
      <span className="font-medium text-tone-danger-fg">
        {formatCurrency(c.totalDiscountGiven || 0)}
      </span>
    ),
  },
  {
    id: 'endDate',
    header: 'ينتهي في',
    width: '110px',
    cell: (c) => (
      <span className="text-text-muted nums">
        {new Date(c.endDate).toLocaleDateString('en-CA')}
      </span>
    ),
  },
  {
    id: 'state',
    header: 'الحالة',
    width: '110px',
    truncate: false,
    hideable: false,
    cell: (c) => {
      const state = couponState(c)
      return <StatusBadge tone={state.tone} label={state.label} />
    },
  },
]

export default function MerchantCouponsPage() {
  const coupons = useMerchantCoupons()
  const [tab, setTab] = React.useState('all')
  const [query, setQuery] = React.useState('')
  const { visible, menu } = useColumnVisibility(columns, 'merchant.coupons')

  const all = React.useMemo(() => coupons.data ?? [], [coupons.data])

  const buckets = React.useMemo(
    () => ({
      all: all.length,
      active: all.filter(isLive).length,
      expired: all.filter(isExpired).length,
    }),
    [all],
  )

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((c) => {
      if (q && !c.code.toLowerCase().includes(q)) return false
      if (tab === 'active') return isLive(c)
      if (tab === 'expired') return isExpired(c)
      return true
    })
  }, [all, query, tab])

  const totals = React.useMemo(
    () => ({
      discount: all.reduce((sum, c) => sum + (c.totalDiscountGiven || 0), 0),
      orders: all.reduce((sum, c) => sum + (c.totalOrders || 0), 0),
    }),
    [all],
  )

  // Average discount per coupon-driven order — the number that says whether the
  // promotion is worth what it costs.
  const perOrder = totals.orders > 0 ? totals.discount / totals.orders : 0

  return (
    <Page>
      <PageHeader
        title="الكوبونات"
        description="الكوبونات المطبقة على منتجاتك وأثرها على مبيعاتك."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => coupons.refetch()}
            loading={coupons.isFetching && !coupons.isLoading}
            aria-label="تحديث"
          >
            <RefreshCw />
            تحديث
          </Button>
        }
        tabs={
          <ViewTabs
            tabs={[
              { id: 'all', label: 'الكل', count: buckets.all },
              { id: 'active', label: 'نشط', count: buckets.active },
              { id: 'expired', label: 'منتهي', count: buckets.expired },
            ]}
            value={tab}
            onValueChange={setTab}
          />
        }
      />

      <PageBody>
        {coupons.isError ? (
          <ErrorState size="page" onRetry={() => coupons.refetch()} />
        ) : (
          <Stack gap="lg">
            <Alert tone="info">
              الكوبونات تُنشئها إدارة نُوبيان وتُطبَّق على منتجاتك. لعرض كوبون جديد على متجرك، تواصل
              معنا عبر الدعم.
            </Alert>

            {coupons.isLoading ? (
              <StatRowSkeleton columns={4} />
            ) : (
              <StatRow columns={4}>
                <Stat
                  emphasis
                  label="الطلبات من الكوبونات"
                  value={nf.format(totals.orders)}
                  hint="طلبات استُخدم فيها كوبون"
                />
                <Stat
                  label="إجمالي الخصومات"
                  value={formatCurrency(totals.discount)}
                  hint="القيمة التي تحمّلتها العروض"
                />
                <Stat
                  label="متوسط الخصم للطلب"
                  value={formatCurrency(perOrder)}
                  hint={
                    totals.orders > 0 ? 'محسوب على الطلبات المخصومة' : 'لا توجد طلبات مخصومة بعد'
                  }
                />
                <Stat
                  label="كوبونات نشطة"
                  value={nf.format(buckets.active)}
                  hint={`من إجمالي ${nf.format(buckets.all)}`}
                />
              </StatRow>
            )}

            <Section variant="panel" flush>
              <Toolbar>
                <SearchInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="ابحث بالكود…"
                  className="w-full max-w-56"
                />
                <ToolbarSpacer />
                {menu}
              </Toolbar>

              <DataTable
                data={rows}
                columns={columns}
                visibleColumns={visible}
                getRowId={(c) => c._id}
                loading={coupons.isLoading}
                empty={
                  <EmptyState
                    icon={<Gift className="size-4" />}
                    title={
                      query || tab !== 'all'
                        ? 'لا توجد كوبونات مطابقة'
                        : 'لا توجد كوبونات على منتجاتك'
                    }
                    description={
                      query || tab !== 'all'
                        ? 'جرّب تبويباً آخر أو امسح البحث.'
                        : 'عندما تُطبَّق الإدارة كوبوناً على منتجاتك سيظهر هنا مع أثره على المبيعات.'
                    }
                  />
                }
              />
            </Section>
          </Stack>
        )}
      </PageBody>
    </Page>
  )
}
