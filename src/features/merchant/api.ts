'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'

import type { PricedProduct } from '@/features/products/types/product'

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
  team: ['merchant', 'team'] as const,
  memberships: ['merchant', 'memberships'] as const,
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

export type MerchantRecord = {
  _id: string
  storeName?: string
  /** Raw enum from the backend: lowercase `pending | approved | …`. */
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

/**
 * The Merchant document as `/merchants/my-profile` returns it. These are the
 * only names the API knows — `updateMerchantProfile` reads exactly
 * `storeName, description, email, phone, city, logoUrl, banner,
 * preferredInputCurrency` off the body and ignores everything else, so a form
 * posting `business*` keys saves nothing.
 */
export type MerchantProfile = {
  /**
   * The ACTIVE store's id — the one the backend resolved this request against,
   * which for a staff member is not a store keyed to their own account. Use
   * this, never `my-status`, to say which store the console is operating:
   * `my-status` reports on the caller's own *application* and is empty for
   * anyone who was invited onto a team rather than applying.
   */
  _id?: string
  storeName?: string
  ownerName?: string
  description?: string
  email?: string
  phone?: string
  city?: string
  logoUrl?: string
  banner?: string
  /**
   * Currency this store's product forms DEFAULT to. Not a storage currency and
   * not a display currency — amounts are still stored in USD and shoppers still
   * see their own. Absent on stores that predate the field; treat as "USD".
   */
  preferredInputCurrency?: string
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

/**
 * `/api/products/merchant/my-products` is enriched by the backend, so every
 * product carries the full pricing block: `finalPrice`, `originalPrice`,
 * `discountPercentage`, `hasDiscount` and the typed `price` Money envelope.
 *
 * It used to be typed with `price: number` + `discountPrice: number`.
 * `discountPrice` does not exist in the schema at all, and `price` is the
 * envelope **object** — so every numeric read of either returned 0. The shape
 * below is what is actually on the wire; read it through the helpers in
 * `@/features/products/types/product`, never by comparing against
 * `merchantPrice` (which is cost).
 */
export type MerchantProduct = PricedProduct & {
  _id: string
  name: string
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

/**
 * `options` exists so callers who are not necessarily merchants can opt out:
 * `/merchants/my-profile` is gated on an approved merchant, so an admin
 * mounting a shared screen would otherwise fire a request that can only 403.
 */
export function useMerchantProfile(options?: Partial<UseQueryOptions<MerchantProfile>>) {
  return useQuery<MerchantProfile>({
    queryKey: merchantKeys.profile,
    queryFn: async () => unwrap<MerchantProfile>(await request<any>('/api/merchant/profile'), {}),
    staleTime: 60_000,
    ...options,
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

/**
 * The backend's `validatePagination` rejects `limit > 100` with a 400, so the
 * catalogue is walked a page at a time rather than asked for in one go.
 *
 * The list is fetched whole because the products page filters, sorts and pages
 * it on the client — the merchant endpoint has no text search, so server-side
 * paging would reduce "search" to "search this page". `truncated` is set when a
 * catalogue is larger than the cap, so the page can say so instead of quietly
 * showing a subset.
 */
export const PRODUCT_PAGE_SIZE = 100
export const PRODUCT_FETCH_CAP = 1000

export type MerchantCatalogue = {
  items: MerchantProduct[]
  total: number
  truncated: boolean
}

export function useMerchantProducts(options?: Partial<UseQueryOptions<MerchantCatalogue>>) {
  return useQuery<MerchantCatalogue>({
    queryKey: merchantKeys.products,
    queryFn: async () => {
      const items: MerchantProduct[] = []
      let page = 1
      let total = 0
      let totalPages = 1

      while (page <= totalPages && items.length < PRODUCT_FETCH_CAP) {
        const body = await request<any>(
          `/api/products/merchant/my-products?page=${page}&limit=${PRODUCT_PAGE_SIZE}`,
        )
        const batch: MerchantProduct[] = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : []
        items.push(...batch)

        const meta = body?.meta?.pagination
        total = meta?.total ?? items.length
        totalPages = meta?.totalPages ?? 1
        // A response without pagination meta means there is nothing to page.
        if (!meta || batch.length === 0) break
        page += 1
      }

      return { items, total, truncated: items.length < total }
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
/* Team                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A store can be run by more than one person. Roles are cumulative —
 * staff ⊆ manager ⊆ owner — and the backend gates every route on a permission
 * string rather than on the role name, so this list is for rendering only.
 * Never decide access from it; the API is the authority.
 */
export type StoreRole = 'owner' | 'manager' | 'staff'
export type MemberStatus = 'invited' | 'active' | 'revoked'

export type StoreMember = {
  id: string
  email: string
  role: StoreRole
  status: MemberStatus
  userId: string | null
  permissions: string[]
  invitedAt: string | null
  acceptedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export type StoreMembership = {
  membershipId: string
  merchantId: string
  storeName: string
  storeStatus: string
  logoUrl: string | null
  city: string | null
  role: StoreRole
  status: MemberStatus
  permissions: string[]
}

/**
 * Permission strings, mirrored from the backend's `lib/merchantPermissions.js`.
 *
 * Routes are gated on these, never on the role name, so a screen that wants to
 * know whether to render a control asks for the permission rather than
 * comparing roles. Keep the values in step with the backend table.
 */
export const STORE_PERMISSIONS = {
  /** Storefront identity: name, description, logo, banner. Owner only. */
  PROFILE_WRITE: 'profile:write',
  /** Payout and compliance fields. Owner only. */
  PAYOUTS_WRITE: 'payouts:write',
  /** Invite, re-role and revoke members. Owner only. */
  TEAM_WRITE: 'team:write',
  PRODUCTS_WRITE: 'products:write',
  COUPONS_WRITE: 'coupons:write',
} as const

export const ROLE_LABELS: Record<StoreRole, string> = {
  owner: 'مالك المتجر',
  manager: 'مدير',
  staff: 'موظف',
}

export const ROLE_DESCRIPTIONS: Record<StoreRole, string> = {
  owner: 'صلاحية كاملة، بما فيها الفريق وبيانات التحويل وملف المتجر.',
  manager: 'المنتجات والكوبونات والطلبات والتحليلات. لا يملك إدارة الفريق.',
  staff: 'الطلبات فقط، مع الاطلاع على المنتجات.',
}

/**
 * The team, plus the caller's own role and permissions.
 *
 * The role comes back in `meta` rather than being inferred by matching the
 * signed-in user against the member list: the list is keyed on Clerk ids the
 * browser does not have, and guessing wrong would render the wrong controls.
 */
export type StoreTeam = {
  members: StoreMember[]
  role: StoreRole | null
  permissions: string[]
}

export function useStoreTeam() {
  return useQuery<StoreTeam>({
    queryKey: merchantKeys.team,
    queryFn: async () => {
      const body = await request<any>('/api/merchant/team')
      return {
        members: (Array.isArray(body?.data) ? body.data : []) as StoreMember[],
        role: (body?.meta?.role ?? null) as StoreRole | null,
        permissions: (body?.meta?.permissions ?? []) as string[],
      }
    },
    staleTime: 30_000,
  })
}

/**
 * What the signed-in person may do in the store the console is currently
 * operating.
 *
 * Derived from the team query rather than a second endpoint: reading the team
 * is open to every member, it already reports the caller's own role and
 * permissions in `meta`, and sharing the one query means a screen that shows
 * both the team and a permission-gated control fetches once.
 *
 * Advisory only. The backend re-checks the permission on every write, so a
 * hidden or disabled control is a courtesy to the user — never the thing that
 * enforces the rule.
 */
export function useStorePermissions() {
  const team = useStoreTeam()
  const permissions = team.data?.permissions ?? []

  return {
    role: team.data?.role ?? null,
    permissions,
    can: (permission: string) => permissions.includes(permission),
    // Callers gate on this so a form does not render editable for a moment and
    // then lock itself once the answer lands.
    isLoading: team.isLoading,
    /**
     * The request failed, so we know nothing — not "you may do nothing".
     * A screen should fall open rather than closed here: locking an owner out
     * of their own settings because an unrelated call timed out is worse than
     * letting the request through to the backend, which enforces regardless.
     */
    isUnknown: team.isError,
  }
}

/**
 * Stores the caller belongs to and invitations awaiting them.
 *
 * Not gated on being an approved merchant — an invitee has no store yet, and
 * this is how the dashboard tells them an invitation is waiting.
 */
export function useMyMemberships() {
  return useQuery<StoreMembership[]>({
    queryKey: merchantKeys.memberships,
    queryFn: async () => {
      const body = await request<any>('/api/merchant/memberships')
      return (Array.isArray(body?.data) ? body.data : []) as StoreMembership[]
    },
    staleTime: 60_000,
  })
}

export function useInviteMember() {
  const invalidate = useInvalidateMerchant()
  return useMutation({
    mutationFn: (values: { email: string; role: StoreRole }) =>
      request('/api/merchant/team', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => invalidate([merchantKeys.team]),
  })
}

export function useUpdateMemberRole() {
  const invalidate = useInvalidateMerchant()
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: StoreRole }) =>
      request(`/api/merchant/team/${encodeURIComponent(memberId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => invalidate([merchantKeys.team]),
  })
}

export function useRemoveMember() {
  const invalidate = useInvalidateMerchant()
  return useMutation({
    mutationFn: (memberId: string) =>
      request(`/api/merchant/team/${encodeURIComponent(memberId)}`, { method: 'DELETE' }),
    onSuccess: () => invalidate([merchantKeys.team]),
  })
}

export function useTransferOwnership() {
  const invalidate = useInvalidateMerchant()
  return useMutation({
    mutationFn: (memberId: string) =>
      request('/api/merchant/team/transfer', {
        method: 'POST',
        body: JSON.stringify({ memberId }),
      }),
    // Ownership changes what the caller may do everywhere, not just on this
    // screen — drop the whole merchant cache rather than one key.
    onSuccess: () => invalidate(),
  })
}

export function useAcceptInvite() {
  const invalidate = useInvalidateMerchant()
  return useMutation({
    mutationFn: (merchantId?: string) =>
      request<any>('/api/merchant/invite/accept', {
        method: 'POST',
        body: JSON.stringify(merchantId ? { merchantId } : {}),
      }),
    onSuccess: () => invalidate(),
  })
}

/**
 * Record which store the console is operating.
 *
 * The whole merchant cache is dropped afterwards: every cached list belongs to
 * the store that was active when it was fetched, and showing one store's orders
 * under another store's name is worse than a moment of loading.
 */
export function useSelectStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (merchantId: string) =>
      request('/api/merchant/active-store', {
        method: 'POST',
        body: JSON.stringify({ merchantId }),
      }),
    onSuccess: () => qc.removeQueries({ queryKey: merchantKeys.all }),
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
