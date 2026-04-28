/**
 * Merchant's own products. Backend resolves the merchant from the session.
 */

import { NextRequest } from 'next/server';
import { proxyToAuth, searchParamsToQuery } from '@/lib/authProxy';

export async function GET(req: NextRequest) {
  const query = searchParamsToQuery(req.nextUrl.searchParams);
  return proxyToAuth({
    path: '/products/merchant/my-products',
    method: 'GET',
    query,
  });
}
