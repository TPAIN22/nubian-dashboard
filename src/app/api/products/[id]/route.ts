/**
 * Single-product GET / update / delete.
 *
 * Ownership and role enforcement happen on the backend.
 */

import { NextRequest } from 'next/server';
import { proxyToAuth } from '@/lib/authProxy';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToAuth({
    path: `/products/${encodeURIComponent(id)}`,
    method: 'GET',
    allowAnonymous: true,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  // Backend uses PUT for product update; map PATCH → PUT for compatibility
  return proxyToAuth({
    path: `/products/${encodeURIComponent(id)}`,
    method: 'PUT',
    body,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({
    path: `/products/${encodeURIComponent(id)}`,
    method: 'PUT',
    body,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToAuth({
    path: `/products/${encodeURIComponent(id)}`,
    method: 'DELETE',
  });
}
