/**
 * Admin orders list — forwards page/limit/status query params to the
 * backend's paginated `/orders/admin` endpoint. Keeps all auth and
 * paging logic on the server so the dashboard never holds a bearer
 * token in client memory longer than the Clerk session needs.
 */

import { NextRequest } from 'next/server';
import { proxyToAuth, searchParamsToQuery } from '@/lib/authProxy';

export async function GET(req: NextRequest) {
  const query = searchParamsToQuery(req.nextUrl.searchParams);
  return proxyToAuth({
    path: '/orders/admin',
    method: 'GET',
    query,
  });
}
