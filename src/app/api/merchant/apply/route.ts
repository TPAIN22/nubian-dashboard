/**
 * Merchant application form submission.
 *
 * Backend enforces:
 *   - one-application-per-user (409 on duplicate)
 *   - schema validation
 *   - resubmit-on-revision flow
 */

import { NextRequest } from 'next/server';
import { proxyToAuth } from '@/lib/authProxy';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({
    path: '/merchants/apply',
    method: 'POST',
    body,
  });
}
