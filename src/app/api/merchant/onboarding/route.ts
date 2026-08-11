/**
 * The signed-in person's progress through the merchant console tour.
 *
 * Proxied like every other merchant call so the request carries a real Clerk
 * bearer token server-side rather than depending on a cross-site cookie.
 */

import { NextRequest } from 'next/server'
import { proxyToAuth } from '@/lib/authProxy'

export async function GET() {
  return proxyToAuth({ path: '/merchants/onboarding', method: 'GET' })
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return proxyToAuth({ path: '/merchants/onboarding', method: 'PUT', body })
}
