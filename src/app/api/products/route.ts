/**
 * Public product listing + create.
 *
 * Pure proxy to the unified backend (`nubian-auth`). All product business
 * logic — variants, dynamic pricing, ranking, currency conversion — lives
 * in the backend.
 */

import { NextRequest } from 'next/server';
import { proxyToAuth, searchParamsToQuery } from '@/lib/authProxy';

export async function GET(req: NextRequest) {
  const query = searchParamsToQuery(req.nextUrl.searchParams);
  return proxyToAuth({
    path: '/products',
    method: 'GET',
    query,
    allowAnonymous: true, // GET /products is public on the backend
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({
    path: '/products',
    method: 'POST',
    body,
  });
}
