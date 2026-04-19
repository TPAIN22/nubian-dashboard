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

    const response = await fetch(`${BACKEND_URL}/admin/marketers/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => null);
    
    if (data) {
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text().catch(() => "Unknown error");
      return NextResponse.json(
        { message: 'Backend Error', error: text },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error(`[GET /api/admin/marketers/${id}]`, error.message);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    let step = "params";
    const { id } = await params;
    
    try {
      step = "auth";
      const { userId, sessionClaims, getToken } = await auth();
      
      step = "role-check";
      const role = await getAdminRole(userId!, sessionClaims);

      if (!userId || (role !== 'admin' && role !== 'support')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      step = "token";
      const token = await getToken();
      
      step = "request-body";
      const body = await req.json();

      step = "backend-fetch";
      const response = await fetch(`${BACKEND_URL}/admin/marketers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      step = "response-processing";
      const data = await response.json().catch(() => null);
      
      if (data) {
        return NextResponse.json(data, { status: response.status });
      } else {
        const text = await response.text().catch(() => "Unknown error");
        return NextResponse.json(
          { message: 'Backend Error', error: text, step },
          { status: response.status }
        );
      }
    } catch (error: any) {
      console.error(`[PUT /api/admin/marketers/${id}] Failed at ${step}:`, error.message);
      return NextResponse.json(
        { message: 'Internal Server Error', error: error.message, step },
        { status: 500 }
      );
    }
}

export async function DELETE(
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

    const response = await fetch(`${BACKEND_URL}/admin/marketers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => null);
    
    if (data) {
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text().catch(() => "Unknown error");
      return NextResponse.json(
        { message: 'Backend Error', error: text },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error(`[DELETE /api/admin/marketers/${id}]`, error.message);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
