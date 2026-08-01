'use client'

import { useQuery } from '@tanstack/react-query'
import type { CountKey } from './nav'

/* ============================================================================
   Live sidebar badges
   ----------------------------------------------------------------------------
   Sourced from the existing /api/admin/analytics proxy (backend
   GET /api/analytics/overview) — no new endpoints, no invented numbers.

   `openTickets` is intentionally absent: the overview payload does not expose a
   ticket count, and a badge that lies is worse than no badge. When the backend
   adds one, map it here and the sidebar picks it up automatically.
   ========================================================================== */

export type AdminOverview = {
  merchants: { approved: number; pending: number; suspended: number; rejected: number }
  products: { total: number; active: number; inactive: number }
  orders: { total: number; pendingPayment: number; delivered: number }
  users: { total: number }
  revenue: { netDelivered: number; grossDelivered: number; deliveredOrderCount: number }
}

const EMPTY: AdminOverview = {
  merchants: { approved: 0, pending: 0, suspended: 0, rejected: 0 },
  products: { total: 0, active: 0, inactive: 0 },
  orders: { total: 0, pendingPayment: 0, delivered: 0 },
  users: { total: 0 },
  revenue: { netDelivered: 0, grossDelivered: 0, deliveredOrderCount: 0 },
}

export const adminOverviewQueryKey = ['admin', 'overview'] as const

async function fetchOverview(): Promise<AdminOverview> {
  const res = await fetch('/api/admin/analytics')
  if (!res.ok) throw new Error('failed to load overview')
  const json = await res.json()
  const raw = json?.raw as Partial<AdminOverview> | undefined
  if (!raw) {
    // Older proxy shape — fall back to the flattened `stats` object.
    const s = json?.stats ?? {}
    return {
      ...EMPTY,
      merchants: { ...EMPTY.merchants, approved: s.totalMerchants ?? 0, pending: s.pendingMerchants ?? 0 },
      products: { ...EMPTY.products, total: s.totalProducts ?? 0 },
      orders: { ...EMPTY.orders, total: s.totalOrders ?? 0 },
      revenue: { ...EMPTY.revenue, netDelivered: s.totalRevenue ?? 0 },
    }
  }
  return { ...EMPTY, ...raw } as AdminOverview
}

export function useAdminOverview() {
  return useQuery({
    queryKey: adminOverviewQueryKey,
    queryFn: fetchOverview,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
}

/** Badge counts keyed the way `NavItem.badge` expects. */
export function useAdminCounts(): Partial<Record<CountKey, number>> {
  const { data } = useAdminOverview()
  if (!data) return {}
  return {
    pendingMerchants: data.merchants.pending,
    pendingOrders: data.orders.pendingPayment,
  }
}
