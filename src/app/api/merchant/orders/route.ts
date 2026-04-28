/**
 * Merchant's own orders. Backend resolves the merchant from the session
 * and only returns orders containing this merchant's products.
 */

import { NextRequest } from 'next/server';
import { proxyToAuth, searchParamsToQuery } from '@/lib/authProxy';

export async function GET(req: NextRequest) {
  const query = searchParamsToQuery(req.nextUrl.searchParams);
  return proxyToAuth({
    path: '/orders/merchant/my-orders',
    method: 'GET',
    query,
  });
}
