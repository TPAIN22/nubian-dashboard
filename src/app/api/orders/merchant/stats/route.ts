/**
 * Merchant order stats — totals, status counts, revenue by status.
 *
 * Backend already exposes this aggregation at /api/orders/merchant/stats
 * (see order.controller.js#getMerchantOrderStats).
 */

import { NextRequest } from 'next/server';
import { proxyToAuth, searchParamsToQuery } from '@/lib/authProxy';

export async function GET(req: NextRequest) {
  const query = searchParamsToQuery(req.nextUrl.searchParams);
  return proxyToAuth({
    path: '/orders/merchant/stats',
    method: 'GET',
    query,
  });
}
