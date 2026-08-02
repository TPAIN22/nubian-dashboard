/**
 * Coupons that apply to the signed-in merchant's catalogue.
 *
 * The page previously had to discover its own merchant id first (two requests,
 * with a `/merchants/me` → `/merchants/my-status` fallback chain) purely so it
 * could pass `?merchantId=` to a public listing endpoint. The id is derivable
 * from the session, so resolve it here once, server-side.
 */

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { proxyToAuth, searchParamsToQuery } from "@/lib/authProxy";
import logger from "@/lib/logger";

const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.AUTH_API_URL || "";
  if (!raw) return "";
  const trimmed = raw.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
})();

export async function GET(req: NextRequest) {
  if (!API_BASE) {
    return NextResponse.json(
      { message: "Server misconfigured: AUTH backend URL is not set." },
      { status: 500 }
    );
  }

  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let merchantId: string | undefined;
  try {
    const status = await axios.get(`${API_BASE}/merchants/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
      timeout: 30_000,
    });
    merchantId = status.data?.data?.merchant?._id;
  } catch (err) {
    logger.error("merchant/coupons: failed to resolve merchant", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (!merchantId) {
    // No merchant record yet — an empty list is the honest answer, and it keeps
    // the page rendering its empty state instead of an error.
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }

  return proxyToAuth({
    path: "/coupons",
    method: "GET",
    query: { ...searchParamsToQuery(req.nextUrl.searchParams), merchantId },
  });
}
