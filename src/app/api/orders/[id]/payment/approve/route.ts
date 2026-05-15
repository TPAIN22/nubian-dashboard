import { NextRequest } from 'next/server';
import { proxyToAuth } from '@/lib/authProxy';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyToAuth({
    path: `/orders/${encodeURIComponent(id)}/payment/approve`,
    method: 'PATCH',
    body: {},
    forwardHeaders: { 'Idempotency-Key': req.headers.get('idempotency-key') ?? undefined },
  });
}
