import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getAdminRole(userId: string, sessionClaims: any) {
  let role = (sessionClaims as any)?.publicMetadata?.role;
  if (!role && userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = user.publicMetadata?.role;
    } catch (clerkErr: any) {
      console.error('Clerk fallback failed:', clerkErr.message);
    }
  }
  return role;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId, sessionClaims, getToken } = await auth();
    const role = await getAdminRole(userId!, sessionClaims);

    if (!userId || (role !== 'admin' && role !== 'support')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken();

    const response = await fetch(`${BACKEND_URL}/admin/marketers/${id}/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`[GET /api/admin/marketers/${id}/stats]`, error.message);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
