/**
 * Hand the store to another member. Owner-only on the backend.
 *
 * Declared as its own route rather than a flag on PATCH /team/[memberId]
 * because "transfer" is a one-way action with different consequences —
 * the caller stops being the owner.
 */

import { NextRequest } from "next/server";
import { proxyToAuth } from "@/lib/authProxy";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({ path: "/merchants/my-store/transfer-ownership", method: "POST", body });
}
