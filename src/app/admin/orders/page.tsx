'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import {
  Alert,
  Button,
  Page,
  PageBody,
  PageHeader,
  ViewTabs,
} from '@/components/admin'
import { OrdersTable } from './ordersTable'
import { Order, getOrderTotal, getOrderCurrency, formatMoney } from './types'

/* ============================================================================
   Orders
   ----------------------------------------------------------------------------
   The fetching contract is unchanged: server-side pagination against
   /api/orders/admin, optional `status` filter, `meta.pagination` for counts,
   `loading` for first paint vs `refreshing` for background refetches.

   The layout is not. Status filters are now the page's tab strip (flush under
   the title, where a tab strip belongs) rather than nine buttons wrapping onto
   two rows, and the three "stat cards" that summarised only the current page
   have collapsed into a single honest summary line above the table. That
   recovered roughly 260px — the table now starts above the fold.
   ========================================================================== */

type OrderStatus =
  | 'all'
  | 'PENDING'
  | 'AWAITING_PAYMENT_CONFIRMATION'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'

// Matches `pending` (lowercase legacy) and the SCREAMING_CASE variants.
const PENDING_LIKE = new Set([
  'PENDING',
  'AWAITING_PAYMENT_CONFIRMATION',
  'PROCESSING',
  'pending',
])

const DEFAULT_PAGE_SIZE = 20

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusTabs: { id: OrderStatus; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'PENDING', label: 'قيد الانتظار' },
  { id: 'AWAITING_PAYMENT_CONFIRMATION', label: 'انتظار الدفع' },
  { id: 'CONFIRMED', label: 'مؤكد' },
  { id: 'PROCESSING', label: 'قيد المعالجة' },
  { id: 'SHIPPED', label: 'تم الشحن' },
  { id: 'DELIVERED', label: 'تم التسليم' },
  { id: 'CANCELLED', label: 'ملغي' },
  { id: 'PAYMENT_FAILED', label: 'فشل الدفع' },
]

export default function Page_() {
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all')
  const [page, setPage] = useState(1)

  const fetchOrders = useCallback(async () => {
    setError(null)
    setRefreshing(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(DEFAULT_PAGE_SIZE),
      })
      if (selectedStatus !== 'all') params.set('status', selectedStatus)

      const res = await fetch(`/api/orders/admin?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.message || `فشل تحميل الطلبات (${res.status})`)
        return
      }
      // Backend wraps the response: { success, data, meta: { pagination } }.
      // Tolerate both wrapped and bare shapes.
      const items: Order[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : []
      const meta = data?.meta?.pagination
      setOrders(items)
      setPagination({
        page: meta?.page ?? page,
        limit: meta?.limit ?? DEFAULT_PAGE_SIZE,
        total: meta?.total ?? items.length,
        totalPages: meta?.totalPages ?? 1,
      })
    } catch (e) {
      console.error('Error fetching orders:', e)
      setError(e instanceof Error ? e.message : 'فشل تحميل الطلبات')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, selectedStatus])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Reset to page 1 when the status filter changes.
  useEffect(() => {
    setPage(1)
  }, [selectedStatus])

  /* -- page summary ------------------------------------------------------- */
  // Deliberately scoped to the loaded page and labelled as such: the backend
  // has no per-status stats endpoint, so a platform-wide figure here would be
  // invented. The overview page carries the real totals.
  const revenueByCurrency = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders) {
      const code = getOrderCurrency(o)
      map[code] = (map[code] || 0) + (getOrderTotal(o) || 0)
    }
    return Object.entries(map).sort(([, a], [, b]) => b - a)
  }, [orders])

  const pendingOnPage = orders.filter((o) => PENDING_LIKE.has(o.status || '')).length

  return (
    <Page>
      <PageHeader
        title="الطلبات"
        description="متابعة الطلبات وحالات الدفع والشحن."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchOrders}
            loading={refreshing}
            aria-label="تحديث قائمة الطلبات"
          >
            <RefreshCw />
            تحديث
          </Button>
        }
        tabs={
          <ViewTabs
            tabs={statusTabs.map((t) => ({
              id: t.id,
              label: t.label,
              // Only the active tab can carry a truthful count — there is no
              // per-status stats endpoint, so an inactive tab's number could
              // only be guessed from the current page.
              count: t.id === selectedStatus && !loading ? pagination.total : undefined,
            }))}
            value={selectedStatus}
            onValueChange={(id) => setSelectedStatus(id as OrderStatus)}
          />
        }
      />

      <PageBody variant="flush" className="flex flex-col">
        {error && (
          <div className="px-6 pt-4">
            <Alert
              tone="danger"
              title="تعذر تحميل الطلبات"
              action={
                <Button variant="secondary" size="sm" onClick={fetchOrders} loading={refreshing}>
                  إعادة المحاولة
                </Button>
              }
            >
              {error}
            </Alert>
          </div>
        )}

        {/* Honest, one-line page summary in place of three cards. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border px-3 py-2 text-[12px] text-text-muted">
          <span>
            إجمالي هذه الصفحة:{' '}
            <span className="font-medium text-foreground nums">
              {revenueByCurrency.length === 0
                ? '—'
                : revenueByCurrency
                    .map(([code, total]) => formatMoney(total, code))
                    .join(' · ')}
            </span>
          </span>
          <span>
            تحتاج معالجة:{' '}
            <span className="font-medium text-foreground nums">{pendingOnPage}</span>
          </span>
          <span className="text-text-faint">الأرقام محسوبة من الصفحة المعروضة فقط</span>
        </div>

        <OrdersTable
          orders={orders}
          onRefresh={fetchOrders}
          pagination={pagination}
          onPageChange={setPage}
          isLoading={loading}
          isRefreshing={refreshing && !loading}
        />
      </PageBody>
    </Page>
  )
}
