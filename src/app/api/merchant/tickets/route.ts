/**
 * Support tickets visible to the signed-in merchant.
 *
 * Backend scopes `/tickets` to the caller, so no merchant id is needed here.
 */

import { NextRequest } from "next/server";
import { proxyToAuth, searchParamsToQuery } from "@/lib/authProxy";

export async function GET(req: NextRequest) {
  return proxyToAuth({
    path: "/tickets",
    method: "GET",
    query: searchParamsToQuery(req.nextUrl.searchParams),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({ path: "/tickets", method: "POST", body });
}
