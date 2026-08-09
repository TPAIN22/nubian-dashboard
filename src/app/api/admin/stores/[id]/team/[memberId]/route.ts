/**
 * Admin change of one member's role, or revocation of their access.
 *
 * The backend refuses to touch the owner's row through either verb — ownership
 * moves only through the merchant's own transfer flow, which is deliberately
 * not exposed to admins.
 */

import { NextRequest } from "next/server";
import { proxyToAuth } from "@/lib/authProxy";

type Params = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, memberId } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({
    path: `/merchants/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`,
    method: "PATCH",
    body,
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, memberId } = await params;
  return proxyToAuth({
    path: `/merchants/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`,
    method: "DELETE",
  });
}
