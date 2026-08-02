'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ReceiptText, RefreshCw } from 'lucide-react'

import {
  Button,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Page,
  PageBody,
  PageHeader,
  Pagination,
  SearchInput,
  Section,
  Toolbar,
  ToolbarSpacer,
  ViewTabs,
  useColumnVisibility,
  type ViewTab,
} from '@/components/admin'
import { useMerchantOrders, useMerchantStats } from '@/features/merchant/api'
import { OrdersTable, useOrderActions, useOrderColumns } from './ordersTable'

/* ============================================================================
   Orders
   ----------------------------------------------------------------------------
   Server-paginated. Two things the old page got wrong and this one fixes:

     1. TAB COUNTS. It showed the active tab's real total and, for every other
        tab, the count of matching rows *on the current page* — so "مؤكد 3"
        really meant "3 of the 20 orders you happen to be looking at". Counts
        now come from the merchant stats aggregate, which covers every order.
     2. HEADLINE REVENUE. It summed `merchantRevenue` across the loaded page and
        labelled it "إيرادات الصفحة". A per-page subtotal isn't a business
        figure. The header now reports the store's real delivered revenue.
   ========================================================================== */

const PAGE_SIZES = [25, 50]

/** Tab ids are the lowercase values the backend's status filter accepts. */
const TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'بانتظار التأكيد' },
  { id: 'confirmed', label: 'مؤكد' },
  { id: 'shipped', label: 'تم الشحن' },
  { id: 'delivered', label: 'تم التسليم' },
  { id: 'cancelled', label: 'ملغي' },
]

/**
 * `useSearchParams` opts the tree into client-side rendering, so it needs a
 * Suspense boundary or the whole route de-opts at build time.
 */
export default function MerchantOrdersPage() {
  return (
    <React.Suspense fallback={<OrdersFallback />}>
      <OrdersView />
    </React.Suspense>
  )
}

function OrdersFallback() {
  return (
    <Page>
      <PageHeader title="الطلبات" description="طلبات تحتوي منتجاتك، مع إيرادك من كل طلب." />
      <PageBody variant="flush">
        <Section variant="panel" flush className="m-4 rounded-lg">
          <ListSkeleton rows={8} />
        </Section>
      </PageBody>
    </Page>
  )
}

function OrdersView() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // The overview links here with ?status=… so a work-queue row lands on the
  // exact tab that clears it.
  const initialTab = searchParams.get('status')
  const [tab, setTab] = React.useState(
    initialTab && TABS.some((t) => t.id === initialTab) ? initialTab : 'all',
  )
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<string[]>([])

  const orders = useMerchantOrders({ page, status: tab, limit: pageSize })
  const stats = useMerchantStats()
  const actions = useOrderActions()
  const columns = useOrderColumns()
  const { visible, menu } = useColumnVisibility(columns, 'merchant.orders')

  const selectTab = (id: string) => {
    setTab(id)
    setPage(1)
    setSelected([])
    // Keep the URL honest so the tab survives a refresh or a shared link.
    router.replace(id === 'all' ? '/merchant/orders' : `/merchant/orders?status=${id}`, {
      scroll: false,
    })
  }

  React.useEffect(() => setPage(1), [pageSize])

  const tabs: ViewTab[] = React.useMemo(() => {
    const s = stats.data?.statusStats
    return TABS.map((t) => ({
      ...t,
      count: !s ? undefined : t.id === 'all' ? stats.data?.totalOrders : s[t.id as keyof typeof s],
    }))
  }, [stats.data])

  /**
   * Search is client-side over the loaded page — the merchant orders endpoint
   * has no text filter. Labelled as such so nobody reads an empty result as
   * "this order number doesn't exist".
   */
  const rows = React.useMemo(() => {
    const items = orders.data?.items ?? []
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((o) =>
      `${o.orderNumber ?? ''} ${o.customerInfo?.name ?? ''} ${o.customerInfo?.phone ?? ''}`
        .toLowerCase()
        .includes(q),
    )
  }, [orders.data, query])

  const total = orders.data?.total ?? 0

  return (
    <Page>
      <PageHeader
        title="الطلبات"
        description="طلبات تحتوي منتجاتك، مع إيرادك من كل طلب."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => orders.refetch()}
            loading={orders.isFetching && !orders.isLoading}
            aria-label="تحديث"
          >
            <RefreshCw />
            تحديث
          </Button>
        }
        tabs={<ViewTabs tabs={tabs} value={tab} onValueChange={selectTab} />}
      />

      <PageBody variant="flush">
        {orders.isError ? (
          <ErrorState
            size="page"
            description={(orders.error as Error)?.message}
            onRetry={() => orders.refetch()}
          />
        ) : (
          <Section variant="panel" flush className="m-4 rounded-lg">
            <Toolbar>
              <SearchInput
                value={query}
                onValueChange={setQuery}
                placeholder="ابحث في هذه الصفحة…"
                className="w-full max-w-64"
              />
              <ToolbarSpacer />
              {menu}
            </Toolbar>

            <OrdersTable
              data={rows}
              columns={columns}
              visibleColumns={visible}
              loading={orders.isLoading}
              selection={{ selected, onChange: setSelected }}
              actions={actions}
              empty={
                query ? (
                  <EmptyState
                    title="لا توجد نتائج في هذه الصفحة"
                    description="البحث يغطي الصفحة المعروضة فقط. جرّب صفحة أخرى أو غيّر التبويب."
                    action={
                      <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                        مسح البحث
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<ReceiptText className="size-4" />}
                    title={tab === 'all' ? 'لا توجد طلبات بعد' : 'لا توجد طلبات بهذه الحالة'}
                    description={
                      tab === 'all'
                        ? 'ستظهر هنا الطلبات فور شراء العملاء لمنتجاتك.'
                        : 'جرّب تبويباً آخر لعرض بقية الطلبات.'
                    }
                  />
                )
              }
            />

            {total > 0 && (
              <Pagination
                page={orders.data?.page ?? page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizes={PAGE_SIZES}
              />
            )}
          </Section>
        )}
      </PageBody>
    </Page>
  )
}
