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
import { headers, cookies } from 'next/headers';
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

/**
 * Client-IP forwarding.
 *
 * Every request through this proxy leaves from the dashboard's egress address,
 * so without forwarding, the backend sees one IP for the entire user base: its
 * per-IP rate limiter then either does nothing useful or throttles all dashboard
 * users as a group.
 *
 * The IP travels in a private header alongside a shared secret rather than in
 * X-Forwarded-For, because the backend cannot distinguish an XFF entry we added
 * from one an attacker added — honouring it would let any client choose its own
 * rate-limit key. Only a caller holding the secret can set the key.
 *
 * Server-only env var: no NEXT_PUBLIC_ prefix, or the secret ships to browsers
 * and stops being a secret.
 */
const PROXY_SECRET = process.env.INTERNAL_PROXY_SECRET || '';
const CLIENT_IP_HEADER = 'x-nubian-client-ip';
const PROXY_SECRET_HEADER = 'x-nubian-proxy-secret';

// Deliberately a regex rather than node:net — this module must stay importable
// from the Edge runtime.
const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-fA-F:]+$/;
const looksLikeIp = (v: string) =>
  (IPV4.test(v) && v.split('.').every((o) => Number(o) <= 255)) ||
  (v.includes(':') && IPV6.test(v));

let warnedMissingSecret = false;

/** Headers that hand the end user's IP to the backend, or {} if unavailable. */
async function clientIpHeaders(): Promise<Record<string, string>> {
  if (!PROXY_SECRET) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      logger.warn(
        'authProxy: INTERNAL_PROXY_SECRET is not set — not forwarding client IPs. ' +
          'All dashboard traffic will share one rate-limit bucket on the backend.',
      );
    }
    return {};
  }

  try {
    const h = await headers();
    // The platform proxy appends to XFF, so the original client is leftmost.
    const candidate =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || '';
    if (!candidate || !looksLikeIp(candidate)) return {};
    return {
      [CLIENT_IP_HEADER]: candidate,
      [PROXY_SECRET_HEADER]: PROXY_SECRET,
    };
  } catch {
    // headers() throws outside a request scope (e.g. build-time prerender).
    return {};
  }
}

/**
 * Active-store selection.
 *
 * A person can belong to more than one store. The backend refuses to guess
 * which one a request is for — it answers 409 STORE_SELECTION_REQUIRED — so the
 * dashboard's choice travels on every proxied call as `x-merchant-id`.
 *
 * Attached here rather than in each route handler on purpose: forgetting it on
 * one route would silently serve that screen a different store's data.
 * Single-store merchants never set the cookie and never need to.
 */
export const ACTIVE_STORE_COOKIE = 'nubian_active_store';
const ACTIVE_STORE_HEADER = 'x-merchant-id';
const OBJECT_ID = /^[0-9a-f]{24}$/i;

async function activeStoreHeaders(): Promise<Record<string, string>> {
  try {
    const jar = await cookies();
    const value = jar.get(ACTIVE_STORE_COOKIE)?.value?.trim();
    // Shape-check here so a stale or hand-edited cookie fails as "no selection"
    // rather than as a confusing 400 from the backend validator.
    if (!value || !OBJECT_ID.test(value)) return {};
    return { [ACTIVE_STORE_HEADER]: value };
  } catch {
    // cookies() throws outside a request scope (e.g. build-time prerender).
    return {};
  }
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

  // Spread last (below) so a caller-supplied forwardHeaders entry can never
  // overwrite the IP claim or the secret.
  const ipHeaders = await clientIpHeaders();
  // The cookie is authoritative for which store a request is for: no caller
  // currently sets the header itself, and one source of truth is easier to
  // reason about than a precedence rule nobody exercises.
  const storeHeaders = await activeStoreHeaders();

  const config: AxiosRequestConfig = {
    method,
    url: `${API_BASE}${path}`,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
      ...storeHeaders,
      ...ipHeaders,
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
