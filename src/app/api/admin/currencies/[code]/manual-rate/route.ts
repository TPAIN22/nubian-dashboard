import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function resolveRole(userId: string, sessionClaims: unknown) {
  let role = (sessionClaims as any)?.publicMetadata?.role as string | undefined;
  if (!role && userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = user.publicMetadata?.role as string | undefined;
    } catch (e: any) {
      console.error('[manual-rate] Clerk fallback failed:', e.message);
    }
  }
  return role;
}

// PATCH /api/admin/currencies/[code]/manual-rate — set manual rate for a currency
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { userId, sessionClaims, getToken } = await auth();
    const role = await resolveRole(userId!, sessionClaims);

    if (!userId || role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;
    const body = await req.json();
    const token = await getToken();

    const res = await fetch(
      `${BACKEND_URL}/admin/currencies/${code.toUpperCase()}/manual-rate`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[PATCH /api/admin/currencies/[code]/manual-rate]', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
