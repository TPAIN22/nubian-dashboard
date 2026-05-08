/**
 * User self-service: withdraw your own merchant application.
 *
 * Backend enforces:
 *   - auth required
 *   - only pending / rejected / needs_revision applications can be withdrawn
 *   - approved/suspended must go through admin (carries products, orders, balance)
 *
 * Idempotent: returns 200 with `withdrawn: false` if no row exists.
 */

import { NextRequest } from 'next/server';
import { proxyToAuth } from '@/lib/authProxy';

export async function DELETE(_req: NextRequest) {
  return proxyToAuth({
    path: '/merchants/my-application',
    method: 'DELETE',
  });
}
