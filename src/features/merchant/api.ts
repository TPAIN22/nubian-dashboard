'use client'

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'

/* ============================================================================
   Merchant data layer
   ----------------------------------------------------------------------------
   Every merchant screen reads from here. Before this file each page hand-rolled
   its own `useEffect` + `getToken()` + manual timeout races — the dashboard
   alone spent 200 lines on it, and no two pages agreed on how to unwrap the
   backend envelope or what to do when a request failed.

   Two rules:
     1. Talk to the Next proxies under /api, never the backend directly. The
        proxy attaches a real Clerk bearer token server-side, so nothing depends
        on cross-origin cookies surviving.
     2. Unwrap the standardized envelope (`{ success, data, meta }`) exactly
        once, here. Components receive plain data.
   ========================================================================== */

export const merchantKeys = {
  all: ['merchant'] as const,
  status: ['merchant', 'status'] as const,
  profile: ['merchant', 'profile'] as const,
  stats: ['merchant', 'stats'] as const,
  products: ['merchant', 'products'] as const,
  orders: (page: number, status: string) => ['merchant', 'orders', page, status] as const,
  coupons: ['merchant', 'coupons'] as const,
  tickets: (params: Record<string, string>) => ['merchant', 'tickets', params] as const,
  ticket: (id: string) => ['merchant', 'ticket', id] as const,
}

/* -------------------------------------------------------------------------- */
/* Transport                                                                  */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  const body = await res.json().catch(() => null)

  if (!res.ok || body?.success === false) {
    throw new ApiError(
      body?.error?.details?.messageAr ||
        body?.error?.message ||
        body?.message ||
        `فشل الطلب (${res.status})`,
      res.status,
      body?.error?.code ?? body?.code,
    )
  }

  return body as T
}

/** Unwraps `{ success, data }` while tolerating handlers that return raw data. */
function unwrap<T>(body: any, fallback: T): T {
  if (body == null) return fallback
  return (body.data ?? body) as T
}

export const merchantRequest = request

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type MerchantStatusValue =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'NEEDS_REVISION'

export type MerchantRecord = {
  _id: string
  storeName?: string
  businessName?: string
  status: string
  rejectionReason?: string
  revisionNotes?: string
  suspensionReason?: string
  suspendedAt?: string
  createdAt: string
}

export type MerchantStatus = {
  hasApplication: boolean
  application: MerchantRecord | null
}

export type MerchantProfile = {
  businessName?: string
  storeName?: string
  businessDescription?: string
  businessEmail?: string
  businessPhone?: string
  businessAddress?: string
}

export type OrderStatusCounts = {
  pending: number
  confirmed: number
  shipped: number
  delivered: number
  cancelled: number
}

export type MerchantStats = {
  totalOrders: number
  totalRevenue: number
  statusStats: OrderStatusCounts
  revenueByStatus: OrderStatusCounts
}

export type MerchantProduct = {
  _id: string
  name: string
  price: number
  discountPrice: number
  stock: number
  isActive: boolean
  description?: string
  images?: string[]
  sizes?: string[]
  category?: { _id: string; name: string } | string | null
  createdAt: string
  updatedAt: string
}

export type MerchantOrder = {
  _id: string
  orderNumber: string
  status: string
  paymentStatus?: string
  totalAmount: number
  merchantRevenue: number
  transferProof?: string
  products: any[]
  productsCount: number
  customerInfo?: { name?: string; email?: string; phone?: string }
  orderDate: string
  createdAt: string
  currency?: string
  currencyCodeSelected?: string
  finalAmountConverted?: number
  totalAmountConverted?: number
}

export type MerchantCoupon = {
  _id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderAmount: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimitPerUser: number
  usageLimitGlobal?: number
  usageCount: number
  totalDiscountGiven: number
  totalOrders: number
  isActive: boolean
}

export type Paginated<T> = {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

const EMPTY_COUNTS: OrderStatusCounts = {
  pending: 0,
  confirmed: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Application/approval state. `no-store` on the proxy — an admin can approve or
 * suspend a merchant at any moment and a cached "approved" is a security bug.
 */
export function useMerchantStatus() {
  return useQuery({
    queryKey: merchantKeys.status,
    queryFn: () => request<MerchantStatus>('/api/merchant/my-status'),
    staleTime: 30_000,
  })
}

export function useMerchantProfile() {
  return useQuery({
    queryKey: merchantKeys.profile,
    queryFn: async () => unwrap<MerchantProfile>(await request<any>('/api/merchant/profile'), {}),
    staleTime: 60_000,
  })
}

export function useMerchantStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: merchantKeys.stats,
    queryFn: async () => {
      const body = await request<any>('/api/orders/merchant/stats')
      const data = unwrap<Partial<MerchantStats>>(body, {})
      return {
        totalOrders: data.totalOrders ?? 0,
        totalRevenue: data.totalRevenue ?? 0,
        statusStats: { ...EMPTY_COUNTS, ...(data.statusStats ?? {}) },
        revenueByStatus: { ...EMPTY_COUNTS, ...(data.revenueByStatus ?? {}) },
      } satisfies MerchantStats
    },
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  })
}

export function useMerchantProducts(options?: Partial<UseQueryOptions<MerchantProduct[]>>) {
  return useQuery<MerchantProduct[]>({
    queryKey: merchantKeys.products,
    queryFn: async () => {
      const body = await request<any>('/api/products/merchant/my-products?limit=200')
      const items = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
      return items as MerchantProduct[]
    },
    staleTime: 30_000,
    ...options,
  })
}

/**
 * Server-paginated. The backend caps `limit` at 50 for merchant orders and only
 * accepts lowercase status values.
 */
export function useMerchantOrders({
  page,
  status,
  limit = 25,
}: {
  page: number
  status: string
  limit?: number
}) {
  return useQuery<Paginated<MerchantOrder>>({
    queryKey: merchantKeys.orders(page, status),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (status !== 'all') params.set('status', status.toLowerCase())

      const body = await request<any>(`/api/merchant/orders?${params}`)
      const items: MerchantOrder[] = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
          ? body
          : []
      const meta = body?.meta?.pagination
      return {
        items,
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
        total: meta?.total ?? items.length,
        totalPages: meta?.totalPages ?? 1,
      }
    },
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  })
}

export function useMerchantCoupons() {
  return useQuery<MerchantCoupon[]>({
    queryKey: merchantKeys.coupons,
    queryFn: async () => {
      const body = await request<any>('/api/merchant/coupons')
      return (Array.isArray(body?.data) ? body.data : []) as MerchantCoupon[]
    },
    staleTime: 60_000,
  })
}

/* -------------------------------------------------------------------------- */
/* Support tickets                                                            */
/* -------------------------------------------------------------------------- */

export type TicketMessage = {
  _id?: string
  message: string
  senderRole?: string
  senderId?: { fullName?: string }
  createdAt?: string
}

export type MerchantTicket = {
  _id: string
  ticketNumber: string
  subject: string
  description: string
  type?: string
  category?: string
  status?: string
  priority?: string
  createdAt?: string
  messages?: TicketMessage[]
  userId?: { fullName?: string }
  relatedOrderId?: { orderNumber?: string; totalAmount?: number }
}

export function useMerchantTickets(params: Record<string, string>) {
  return useQuery<MerchantTicket[]>({
    queryKey: merchantKeys.tickets(params),
    queryFn: async () => {
      const search = new URLSearchParams(params).toString()
      const body = await request<any>(`/api/merchant/tickets${search ? `?${search}` : ''}`)
      return (Array.isArray(body?.data) ? body.data : []) as MerchantTicket[]
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useMerchantTicket(id: string) {
  return useQuery<MerchantTicket>({
    queryKey: merchantKeys.ticket(id),
    queryFn: async () =>
      unwrap<MerchantTicket>(
        await request<any>(`/api/merchant/tickets/${encodeURIComponent(id)}`),
        {} as MerchantTicket,
      ),
    enabled: Boolean(id),
  })
}

/* -------------------------------------------------------------------------- */
/* Sidebar counts                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Badge counts keyed the way `NavItem.badge` expects.
 *
 * Sourced from the one aggregate the API already computes. Two badges were
 * considered and deliberately left out:
 *
 *   - open tickets — the ticket list returns no open/unread aggregate, and a
 *     badge that lies is worse than no badge;
 *   - out-of-stock products — deriving it means pulling the whole catalogue,
 *     and the shell renders on every merchant route. A count worth one glance
 *     is not worth a 200-row fetch on the settings page. The overview's work
 *     queue reports it instead, where the data is already loaded.
 */
export function useMerchantCounts(): Partial<Record<string, number>> {
  const { data: stats } = useMerchantStats()
  return stats ? { pendingOrders: stats.statusStats.pending } : {}
}

/**
 * Invalidates merchant-scoped queries after a mutation lands.
 *
 * Keys are matched by prefix, so `['merchant','orders']` covers every page and
 * status variant without the caller having to enumerate them.
 */
export function useInvalidateMerchant() {
  const qc = useQueryClient()
  return (keys: readonly (readonly unknown[])[] = [merchantKeys.all]) =>
    Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })))
}
