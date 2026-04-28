/**
 * Admin global analytics — overview cards.
 *
 * Backend endpoint: GET /api/analytics/overview
 * The dashboard's old shape was `{ stats: { totalMerchants, ... } }`.
 * We adapt the new payload to that shape so existing admin pages keep
 * rendering without changes.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import axios, { AxiosError } from 'axios';
import logger from '@/lib/logger';

const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.AUTH_API_URL || '';
  if (!raw) return '';
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
})();

export async function GET() {
  if (!API_BASE) {
    return NextResponse.json(
      { message: 'Server misconfigured: AUTH backend URL is not set.' },
      { status: 500 },
    );
  }

  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const response = await axios.get(`${API_BASE}/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
      timeout: 30_000,
    });

    if (response.status >= 400) {
      return NextResponse.json(response.data, { status: response.status });
    }

    const payload = response.data?.data ?? {};

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalMerchants:   payload.merchants?.approved   ?? 0,
          pendingMerchants: payload.merchants?.pending    ?? 0,
          totalProducts:    payload.products?.total       ?? 0,
          totalOrders:      payload.orders?.total         ?? 0,
          totalRevenue:     payload.revenue?.netDelivered ?? 0,
        },
        // Full payload available for richer admin views.
        raw: payload,
      },
      { status: 200 },
    );
  } catch (err) {
    const axErr = err as AxiosError<{ message?: string }>;
    logger.error('Failed to fetch admin analytics', {
      error: axErr.message,
      status: axErr.response?.status,
    });
    return NextResponse.json(
      { message: axErr.response?.data?.message || 'Failed to fetch analytics' },
      { status: axErr.response?.status || 500 },
    );
  }
}
