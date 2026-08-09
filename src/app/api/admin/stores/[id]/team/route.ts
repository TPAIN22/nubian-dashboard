/**
 * Admin view of, and control over, one store's team.
 *
 * Admin-gated on the backend. Every call is audited there with an
 * `adminStoreTeamAction` marker, reads included — an admin changing who can
 * reach a live store's orders and payouts has to be reconstructable later.
 */

import { NextRequest } from "next/server";
import { proxyToAuth } from "@/lib/authProxy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToAuth({
    path: `/merchants/${encodeURIComponent(id)}/members`,
    method: "GET",
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({
    path: `/merchants/${encodeURIComponent(id)}/members`,
    method: "POST",
    body,
  });
}
