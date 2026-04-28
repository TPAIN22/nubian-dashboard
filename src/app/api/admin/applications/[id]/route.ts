/**
 * Admin: view a single merchant application + change its status.
 *
 * Status transitions are mapped to dedicated backend endpoints so the
 * backend can run side effects (email + Clerk metadata sync + product
 * cascade deactivation on suspend, etc.) atomically.
 *
 * Body shape (PATCH):
 *   { status: 'approved' | 'rejected' | 'needs_revision' | 'suspended',
 *     rejectionReason?: string,
 *     revisionNotes?: string,
 *     suspensionReason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyToAuth } from '@/lib/authProxy';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const response = await proxyToAuth({
    path: `/merchants/${encodeURIComponent(id)}`,
    method: 'GET',
  });

  if (response.status >= 400) return response;

  // Backend → { success, data: {...merchant} }; dashboard expects { application }
  const payload = await response.json();
  return NextResponse.json(
    { application: payload?.data ?? null },
    { status: 200 },
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, rejectionReason, revisionNotes, suspensionReason } = body ?? {};

  const safeId = encodeURIComponent(id);

  switch (status) {
    case 'approved':
      return proxyToAuth({
        path: `/merchants/${safeId}/approve`,
        method: 'PATCH',
      });

    case 'rejected':
      return proxyToAuth({
        path: `/merchants/${safeId}/reject`,
        method: 'PATCH',
        body: { rejectionReason },
      });

    case 'needs_revision':
      return proxyToAuth({
        path: `/merchants/${safeId}/request-revision`,
        method: 'PATCH',
        body: { revisionNotes },
      });

    case 'suspended':
      return proxyToAuth({
        path: `/merchants/${safeId}/suspend`,
        method: 'PATCH',
        body: { suspensionReason },
      });

    default:
      return NextResponse.json(
        {
          message:
            'Invalid status. Use one of: approved, rejected, needs_revision, suspended',
        },
        { status: 400 },
      );
  }
}
