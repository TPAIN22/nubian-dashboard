/**
 * Admin product oversight: list all products + moderation actions.
 *
 * Maps to the unified backend admin endpoints:
 *   GET    /api/products/admin/all
 *   PATCH  /api/products/admin/:id/toggle-active
 *   DELETE /api/products/admin/:id/hard-delete
 *
 * Body shape for moderation:
 *   { productId: string, action: 'flag' | 'unflag' | 'deactivate' | 'activate' | 'hard-delete', reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyToAuth, searchParamsToQuery } from '@/lib/authProxy';

export async function GET(req: NextRequest) {
  const query = searchParamsToQuery(req.nextUrl.searchParams);

  // Translate dashboard's `status=flagged|inactive` filter → backend filters
  if (query.status === 'flagged') {
    delete query.status;
    query.isActive = 'false'; // backend uses isActive; flagging maps to inactive
  } else if (query.status === 'inactive') {
    delete query.status;
    query.isActive = 'false';
  }

  return proxyToAuth({
    path: '/products/admin/all',
    method: 'GET',
    query,
  });
}

export async function PATCH(req: NextRequest) {
  const { productId, action } = await req
    .json()
    .catch(() => ({ productId: undefined, action: undefined }));

  if (!productId || typeof productId !== 'string') {
    return NextResponse.json(
      { message: 'productId is required' },
      { status: 400 },
    );
  }

  const id = encodeURIComponent(productId);

  switch (action) {
    case 'flag':
    case 'deactivate':
      return proxyToAuth({
        path: `/products/admin/${id}/toggle-active`,
        method: 'PATCH',
        body: { isActive: false },
      });
    case 'unflag':
    case 'activate':
      return proxyToAuth({
        path: `/products/admin/${id}/toggle-active`,
        method: 'PATCH',
        body: { isActive: true },
      });
    case 'hard-delete':
      return proxyToAuth({
        path: `/products/admin/${id}/hard-delete`,
        method: 'DELETE',
      });
    default:
      return NextResponse.json(
        { message: `Unknown moderation action: ${action}` },
        { status: 400 },
      );
  }
}
