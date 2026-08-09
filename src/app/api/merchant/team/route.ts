/**
 * The signed-in merchant's store team.
 *
 * GET is open to any member of the store; POST is gated on `team:write` by the
 * backend, which is owner-only. The dashboard hides the invite form for other
 * roles, but the refusal that matters happens on the API.
 */

import { NextRequest } from "next/server";
import { proxyToAuth } from "@/lib/authProxy";

export async function GET() {
  return proxyToAuth({ path: "/merchants/my-store/members", method: "GET" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({ path: "/merchants/my-store/members", method: "POST", body });
}
