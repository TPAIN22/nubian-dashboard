import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function resolveAdminRole(userId: string, sessionClaims: unknown): Promise<string | undefined> {
  let role = (sessionClaims as any)?.publicMetadata?.role as string | undefined;
  if (!role && userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = user.publicMetadata?.role as string | undefined;
    } catch (err: any) {
      console.error('[fx-rates] Clerk fallback failed:', err.message);
    }
  }
  return role;
}

// GET /api/admin/fx-rates — fetch latest exchange rates (admin only)
export async function GET(_req: NextRequest) {
  try {
    const { userId, sessionClaims, getToken } = await auth();
    const role = await resolveAdminRole(userId!, sessionClaims);

    if (!userId || role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken();
    const res = await fetch(`${BACKEND_URL}/fx/latest`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[GET /api/admin/fx-rates]', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/admin/fx-rates — manually refresh exchange rates (admin only)
export async function POST(_req: NextRequest) {
  try {
    const { userId, sessionClaims, getToken } = await auth();
    const role = await resolveAdminRole(userId!, sessionClaims);

    if (!userId || role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken();
    const res = await fetch(`${BACKEND_URL}/fx/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[POST /api/admin/fx-rates]', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
