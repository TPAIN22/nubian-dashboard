/**
 * Category taxonomy — shared across the whole platform.
 *
 * GET is public (the storefront reads it anonymously); POST requires a session
 * and the backend enforces which roles may extend the taxonomy.
 */

import { NextRequest } from "next/server";
import { proxyToAuth, searchParamsToQuery } from "@/lib/authProxy";

export async function GET(req: NextRequest) {
  return proxyToAuth({
    path: "/categories",
    method: "GET",
    query: searchParamsToQuery(req.nextUrl.searchParams),
    allowAnonymous: true,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({ path: "/categories", method: "POST", body });
}
