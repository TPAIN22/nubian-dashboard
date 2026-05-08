/**
 * Current user's merchant application status.
 *
 * Backend returns `{ data: { hasApplication: boolean, merchant?: ... } }`.
 * We re-shape it to the legacy contract `{ hasApplication, application }`
 * the dashboard UI was written against.
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

    const response = await axios.get(`${API_BASE}/merchants/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
      timeout: 30_000,
    });

    if (response.status >= 400) {
      // Forward the standardized backend envelope so the client can read
      // `error.code` / `error.details.messageAr` for proper UX.
      return NextResponse.json(response.data, { status: response.status });
    }

    // Backend payload: { success, data: { hasApplication, merchant? } }
    const payload = response.data?.data ?? {};
    return NextResponse.json(
      {
        hasApplication: Boolean(payload.hasApplication),
        // Keep the historical key the dashboard reads from.
        application: payload.merchant ?? null,
      },
      {
        status: 200,
        // Defensive: status flips frequently as admins approve/reject; never
        // let a CDN/SW serve a stale "approved" response to a deleted user.
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (err) {
    const axErr = err as AxiosError<{ message?: string }>;
    logger.error('Failed to fetch merchant status', {
      error: axErr.message,
      status: axErr.response?.status,
    });
    return NextResponse.json(
      { message: axErr.response?.data?.message || 'Failed to fetch status' },
      { status: axErr.response?.status || 500 },
    );
  }
}
