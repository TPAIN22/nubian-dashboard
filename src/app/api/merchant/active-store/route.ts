/**
 * Which of the caller's stores the dashboard is currently operating.
 *
 * The choice is a cookie rather than client state because `authProxy` attaches
 * it to every proxied backend call as `x-merchant-id` — a value held in React
 * would not survive a server component render or a hard refresh, and the two
 * halves of the console would disagree about which store they were showing.
 *
 * This route only records the choice. It does NOT grant anything: the backend
 * verifies membership on every request, so a hand-set cookie naming a store the
 * caller has no membership on gets a 403 NOT_A_MEMBER, not that store's data.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ACTIVE_STORE_COOKIE } from "@/lib/authProxy";

const OBJECT_ID = /^[0-9a-f]{24}$/i;

// Matches a Clerk session's practical lifetime — long enough that a merchant
// does not re-pick their store every morning.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const merchantId = typeof body?.merchantId === "string" ? body.merchantId.trim() : "";

  if (!merchantId || !OBJECT_ID.test(merchantId)) {
    return NextResponse.json(
      { message: "merchantId must be a valid store id", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const res = NextResponse.json({ success: true, data: { merchantId } });
  res.cookies.set(ACTIVE_STORE_COOKIE, merchantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return res;
}

/** Clear the selection — the backend then falls back to a sole membership. */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete(ACTIVE_STORE_COOKIE);
  return res;
}
