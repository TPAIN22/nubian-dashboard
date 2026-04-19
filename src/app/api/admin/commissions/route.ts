import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionClaims, getToken } = await auth();
    let role = (sessionClaims as any)?.publicMetadata?.role;

    // Fallback: fetch from Clerk if not in token yet
    if (!role && userId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        role = user.publicMetadata?.role;
      } catch (clerkErr: any) {
        console.error('Clerk fallback failed:', clerkErr.message);
      }
    }

    if (!userId || (role !== 'admin' && role !== 'support')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = await getToken();

    const response = await fetch(`${BACKEND_URL}/admin/commissions?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/admin/commissions]', error.message);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
