/**
 * Coupons that apply to the signed-in merchant's catalogue.
 *
 * Backed by `GET /coupons/merchant/mine`, which resolves the merchant from the
 * session. The page used to call the admin-only `GET /coupons` with a
 * `?merchantId=` it had discovered through two extra requests — that endpoint
 * is `isAdmin`-gated, so it answered 403 for every merchant who ever opened the
 * page.
 */

import { NextRequest } from 'next/server'
import { proxyToAuth, searchParamsToQuery } from '@/lib/authProxy'

export async function GET(req: NextRequest) {
  return proxyToAuth({
    path: '/coupons/merchant/mine',
    method: 'GET',
    query: searchParamsToQuery(req.nextUrl.searchParams),
  })
}
