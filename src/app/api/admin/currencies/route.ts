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
      console.error('[currencies] Clerk fallback failed:', e.message);
    }
  }
  return role;
}

// GET /api/admin/currencies — list all currencies with current rates
export async function GET(_req: NextRequest) {
  try {
    const { userId, sessionClaims, getToken } = await auth();
    const role = await resolveRole(userId!, sessionClaims);

    if (!userId || role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken();
    const res = await fetch(`${BACKEND_URL}/admin/currencies`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[GET /api/admin/currencies]', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
