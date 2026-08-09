/**
 * A single team member: change their role, or revoke their access.
 *
 * Both are gated on `team:write` by the backend, which also refuses to touch
 * the owner's row — ownership moves through /api/merchant/team/transfer.
 */

import { NextRequest } from "next/server";
import { proxyToAuth } from "@/lib/authProxy";

type Params = { params: Promise<{ memberId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({
    path: `/merchants/my-store/members/${encodeURIComponent(memberId)}`,
    method: "PATCH",
    body,
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { memberId } = await params;
  return proxyToAuth({
    path: `/merchants/my-store/members/${encodeURIComponent(memberId)}`,
    method: "DELETE",
  });
}
