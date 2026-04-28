/**
 * Admin: list all merchant applications.
 *
 * Proxies to GET /api/merchants on the unified backend, which returns the
 * full merchant collection (filterable by status). Backend enforces the
 * admin/support role check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyToAuth, searchParamsToQuery } from '@/lib/authProxy';

export async function GET(req: NextRequest) {
  const query = searchParamsToQuery(req.nextUrl.searchParams);

  // Forward the call. Auth backend returns:
  //   { success: true, data: [...merchants], message: ... }
  // Dashboard pages expect: { applications: [...] } — re-shape.
  const response = await proxyToAuth({
    path: '/merchants',
    method: 'GET',
    query,
  });

  if (response.status >= 400) return response;

  const payload = await response.json();
  const applications = Array.isArray(payload?.data) ? payload.data : [];
  return NextResponse.json({ applications }, { status: 200 });
}
