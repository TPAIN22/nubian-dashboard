/**
 * Diagnostic endpoint — Clerk auth + backend connectivity.
 *
 * The dashboard no longer connects to MongoDB directly, so we ping the
 * unified backend's /ping route instead of opening a Mongo connection.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import axios from 'axios';

const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.AUTH_API_URL || '';
  if (!raw) return '';
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
})();

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasApiUrl: !!API_BASE,
      hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
      hasClerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
    auth: null as unknown,
    backend: null as unknown,
  };

  try {
    const { userId, sessionClaims } = await auth();
    results.auth = {
      userId: userId ? `${userId.slice(0, 8)}...` : null,
      role:
        (sessionClaims as { publicMetadata?: { role?: string } } | undefined)
          ?.publicMetadata?.role ?? 'not in claims',
    };
  } catch (e) {
    results.auth = { error: e instanceof Error ? e.message : String(e) };
  }

  if (!API_BASE) {
    results.backend = { error: 'NEXT_PUBLIC_API_URL not set' };
  } else {
    try {
      // Backend exposes /ping at the root, not under /api.
      const pingUrl = API_BASE.replace(/\/api$/, '') + '/ping';
      const response = await axios.get(pingUrl, {
        timeout: 5_000,
        validateStatus: () => true,
      });
      results.backend = {
        url: pingUrl,
        status: response.status,
        ok: response.status === 200,
      };
    } catch (e) {
      results.backend = {
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
