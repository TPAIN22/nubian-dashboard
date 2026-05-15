/**
 * Server-side proxy helper for forwarding requests from Next.js API routes
 * to the unified backend (`nubian-auth`).
 *
 * This is the SOLE bridge between the dashboard and the backend.
 * The dashboard MUST NOT query MongoDB directly — every data fetch flows
 * through this helper so authentication, validation, and business rules
 * stay in one place.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import axios, { AxiosError, AxiosRequestConfig, Method } from 'axios';
import logger from './logger';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.AUTH_API_URL || '';

// Normalize: strip trailing slash, ensure /api suffix.
function normalizeBase(url: string): string {
  if (!url) return '';
  const trimmed = url.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_BASE = normalizeBase(RAW_API_URL);

if (!API_BASE) {
  logger.error(
    'authProxy: NEXT_PUBLIC_API_URL is not set. Dashboard cannot reach the backend.',
  );
}

interface ProxyOptions {
  /** Path on the backend, e.g. "/products" or "/merchants/abc/approve". Must start with /. */
  path: string;
  /** HTTP method to forward. */
  method: Method;
  /** Optional body to forward. */
  body?: unknown;
  /** Optional query params. */
  query?: Record<string, string | number | boolean | undefined>;
  /** If true, the route does not require a Clerk session (rare — use with caution). */
  allowAnonymous?: boolean;
  /** Forwarded request timeout in ms. */
  timeoutMs?: number;
  /** Extra headers to forward to the backend (e.g. Idempotency-Key from the inbound request). */
  forwardHeaders?: Record<string, string | undefined>;
}

/**
 * Forward a request to the backend, attaching the caller's Clerk Bearer token.
 *
 * Returns a NextResponse the API route can return directly. Errors are
 * normalized to `{ message, code? }` shape so the frontend can rely on it.
 */
export async function proxyToAuth({
  path,
  method,
  body,
  query,
  allowAnonymous = false,
  timeoutMs = 30_000,
  forwardHeaders,
}: ProxyOptions): Promise<NextResponse> {
  if (!API_BASE) {
    return NextResponse.json(
      { message: 'Server misconfigured: AUTH backend URL is not set.' },
      { status: 500 },
    );
  }
  if (!path.startsWith('/')) {
    return NextResponse.json(
      { message: `Internal: proxy path must start with "/", got "${path}"` },
      { status: 500 },
    );
  }

  // Always pass through Clerk auth context. If the backend route is public,
  // the missing token simply won't grant elevated permissions.
  let token: string | null = null;
  try {
    const { getToken } = await auth();
    token = await getToken();
  } catch (e) {
    // auth() can throw outside a request context — leave token null.
  }

  if (!token && !allowAnonymous) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only forward header values that are present — undefined values would
  // otherwise turn into the literal string "undefined" on the wire.
  const extraHeaders = forwardHeaders
    ? Object.fromEntries(
        Object.entries(forwardHeaders).filter(([, v]) => typeof v === 'string' && v.length > 0)
      )
    : {};

  const config: AxiosRequestConfig = {
    method,
    url: `${API_BASE}${path}`,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    params: query,
    // Forward body only for methods that carry one.
    ...(['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method).toUpperCase())
      ? { data: body }
      : {}),
    // Treat non-2xx as resolved so we can forward backend status codes verbatim
    // instead of raising. Network errors still throw.
    validateStatus: () => true,
  };

  try {
    const response = await axios.request(config);
    return NextResponse.json(response.data, { status: response.status });
  } catch (err) {
    const axErr = err as AxiosError<{
      message?: string;
      error?: { message?: string; code?: string };
    }>;
    const status = axErr.response?.status ?? 502;
    const data = axErr.response?.data;
    const message =
      data?.error?.message ||
      data?.message ||
      axErr.message ||
      'Upstream backend unavailable';

    logger.error('authProxy: backend request failed', {
      path,
      method,
      status,
      message,
    });

    return NextResponse.json(
      { message, code: data?.error?.code ?? 'PROXY_ERROR' },
      { status },
    );
  }
}

/**
 * Convenience: build a query object from URLSearchParams, dropping undefineds.
 */
export function searchParamsToQuery(
  searchParams: URLSearchParams,
): Record<string, string> {
  const out: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (value !== undefined && value !== '') out[key] = value;
  });
  return out;
}
