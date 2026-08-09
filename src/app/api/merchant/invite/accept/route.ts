/**
 * Accept an invitation to join a store's team.
 *
 * The caller is not a member yet, so this cannot be gated on membership on
 * either side of the proxy. The backend matches the invitation against every
 * email address Clerk holds for the account.
 */

import { NextRequest } from "next/server";
import { proxyToAuth } from "@/lib/authProxy";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({ path: "/merchants/members/accept", method: "POST", body });
}
