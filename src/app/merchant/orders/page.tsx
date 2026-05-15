'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { OrdersTable, type Order } from './ordersTable'
import logger from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, getOrderCurrency, getOrderTotal } from '@/app/admin/orders/types'

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
  // legacy lowercase — kept so old orders still match a tab
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

// Group of statuses each filter tab represents. The backend mixes
// UPPERCASE (new) and lowercase (legacy) status values, so each tab
// matches whichever of its synonyms is present on a given order.
const STATUS_GROUPS: Record<Exclude<OrderStatus, 'all'>, string[]> = {
  PENDING: ['PENDING', 'pending'],
  AWAITING_PAYMENT_CONFIRMATION: ['AWAITING_PAYMENT_CONFIRMATION'],
  CONFIRMED: ['CONFIRMED', 'confirmed'],
  PROCESSING: ['PROCESSING'],
  SHIPPED: ['SHIPPED', 'shipped'],
  DELIVERED: ['DELIVERED', 'delivered'],
  CANCELLED: ['CANCELLED', 'cancelled'],
  PAYMENT_FAILED: ['PAYMENT_FAILED'],
  // unreachable in practice — the union allows these but no tab uses them
  pending: ['pending'],
  confirmed: ['confirmed'],
  shipped: ['shipped'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
}

const DEFAULT_PAGE_SIZE = 20

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// The merchant backend filter accepts lowercase statuses only (see
// orders.route.js:96 validateStatusFilter). Map our UPPERCASE tab values
// to the lowercase wire value when sending to the server.
function tabToServerStatus(s: OrderStatus): string | null {
  if (s === 'all') return null
  const map: Record<string, string> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  }
  return map[s] || String(s).toLowerCase()
}

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all')
  const [page, setPage] = useState(1)

  // Server-side pagination via the Next proxy. The backend caps `limit`
  // at 50 for merchant orders and supports an optional lowercase
  // `status` filter.
  const fetchOrders = useCallback(async () => {
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(DEFAULT_PAGE_SIZE),
      })
      const serverStatus = tabToServerStatus(selectedStatus)
      if (serverStatus) params.set('status', serverStatus)

      const res = await fetch(`/api/merchant/orders?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        setError(data?.message || `فشل تحميل الطلبات (${res.status})`)
        return
      }
      const items: Order[] = Array.isArray(data?.data) ? data.data
        : Array.isArray(data) ? data
        : []
      const meta = data?.meta?.pagination
      setOrders(items)
      setPagination({
        page: meta?.page ?? page,
        limit: meta?.limit ?? DEFAULT_PAGE_SIZE,
        total: meta?.total ?? items.length,
        totalPages: meta?.totalPages ?? 1,
      })
    } catch (e: any) {
      logger.error('Error fetching orders', { error: e instanceof Error ? e.message : String(e) })
      setError(e?.message || 'فشل تحميل الطلبات')
    } finally {
      setLoading(false)
    }
  }, [page, selectedStatus])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Reset to page 1 when the user changes the status filter.
  useEffect(() => {
    setPage(1)
  }, [selectedStatus])

  // Group merchant revenue by the order's selected currency. The backend
  // stores order line prices in USD base + a converted snapshot — sum
  // converted amounts per currency to avoid mixing units.
  // NOTE: this hook must run before any early return so its position in the
  // hook list stays stable across renders.
  const revenueByCurrency = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders) {
      const code = getOrderCurrency(o as any)
      const amount = typeof (o as any).merchantRevenue === 'number'
        ? (o as any).merchantRevenue
        : getOrderTotal(o as any)
      map[code] = (map[code] || 0) + (amount || 0)
    }
    return map
  }, [orders])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="border rounded-md">
          <div className="h-12 bg-muted/40 animate-pulse rounded-t" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 border-t bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
        <h1 className="text-2xl font-bold">طلباتي</h1>
        <div className="border border-destructive/40 bg-destructive/5 rounded-lg p-6 text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchOrders(); }}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  const matchesStatus = (status: OrderStatus, orderStatus?: string) => {
    if (status === 'all') return true
    return STATUS_GROUPS[status]?.includes(String(orderStatus || ''))
  }

  // Server-paginated: the active tab's count is the authoritative total
  // (from meta.pagination.total); other tabs show best-effort counts
  // from the currently loaded page.
  const getStatusCount = (status: OrderStatus) => {
    if (status === selectedStatus) return pagination.total
    return orders.filter(order => matchesStatus(status, order.status)).length
  }

  const pendingOrders = orders.filter(order => STATUS_GROUPS.PENDING.includes(order.status) || STATUS_GROUPS.AWAITING_PAYMENT_CONFIRMATION.includes(order.status)).length
  const todaysOrders = orders.filter(order => {
    const today = new Date().toDateString()
    return new Date(order.orderDate).toDateString() === today
  }).length

  const statusTabs: { value: OrderStatus; label: string; color: string }[] = [
    { value: 'all', label: 'الكل', color: 'default' },
    { value: 'PENDING', label: 'قيد الانتظار', color: 'secondary' },
    { value: 'CONFIRMED', label: 'مؤكد', color: 'default' },
    { value: 'SHIPPED', label: 'تم الشحن', color: 'default' },
    { value: 'DELIVERED', label: 'تم التسليم', color: 'default' },
    { value: 'CANCELLED', label: 'ملغي', color: 'destructive' },
  ]

  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
      <h1 className="text-2xl font-bold">طلباتي</h1>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إيرادات الصفحة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(revenueByCurrency).length === 0 ? (
                <div className="text-2xl font-bold text-green-600">—</div>
              ) : (
                Object.entries(revenueByCurrency)
                  .sort(([, a], [, b]) => b - a)
                  .map(([code, amount]) => (
                    <div key={code} className="text-xl font-bold text-green-600">
                      {formatMoney(amount, code)}
                    </div>
                  ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">من {pagination.total.toLocaleString()} طلب</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلبات قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground">تحتاج إلى معالجة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلبات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {todaysOrders}
            </div>
            <p className="text-xs text-muted-foreground">طلبات اليوم</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={selectedStatus === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus(tab.value)}
            className="text-xs"
          >
            {tab.label}
            <Badge variant={tab.color as any} className="ml-2 text-xs">
              {getStatusCount(tab.value)}
            </Badge>
          </Button>
        ))}
      </div>

      <OrdersTable
        orders={orders}
        onRefresh={fetchOrders}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  )
}

