/**
 * Admin daily time series — powers the overview trend chart.
 *
 * Backend endpoint: GET /api/analytics/timeseries?days=N (admin-only).
 * Mirrors the proxy shape of ../route.ts: bearer token attached server-side,
 * upstream status and body passed through unchanged.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import axios, { AxiosError } from 'axios'
import logger from '@/lib/logger'

const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.AUTH_API_URL || ''
  if (!raw) return ''
  const trimmed = raw.replace(/\/$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
})()

export async function GET(request: NextRequest) {
  if (!API_BASE) {
    return NextResponse.json(
      { message: 'Server misconfigured: AUTH backend URL is not set.' },
      { status: 500 },
    )
  }

  // Clamp here as well as upstream so a hand-edited query string can't turn
  // into an unbounded aggregation.
  const requested = Number.parseInt(request.nextUrl.searchParams.get('days') ?? '', 10)
  const days = Number.isFinite(requested) ? Math.min(Math.max(requested, 7), 365) : 30

  try {
    const { getToken } = await auth()
    const token = await getToken()
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const response = await axios.get(`${API_BASE}/analytics/timeseries`, {
      params: { days },
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
      timeout: 30_000,
    })

    if (response.status >= 400) {
      return NextResponse.json(response.data, { status: response.status })
    }

    return NextResponse.json(
      { success: true, ...(response.data?.data ?? {}) },
      { status: 200 },
    )
  } catch (err) {
    const axErr = err as AxiosError<{ message?: string }>
    logger.error('Failed to fetch admin timeseries', {
      error: axErr.message,
      status: axErr.response?.status,
    })
    return NextResponse.json(
      { message: axErr.response?.data?.message || 'Failed to fetch timeseries' },
      { status: axErr.response?.status || 500 },
    )
  }
}
