/**
 * POST /api/merchants/[id]/link-user
 *
 * Confirm a store claim: attach an unclaimed store to a registered user and
 * grant them merchant access. Admin-only, enforced by the backend.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { axiosInstance } from '@/lib/axiosInstance';
import logger from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await axiosInstance.post(
      `/merchants/${id}/link-user`,
      { clerkUserId: body?.clerkUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const responseData = response.data?.data || response.data;
    return NextResponse.json(responseData);
  } catch (error: any) {
    logger.error('Error linking store to user', {
      merchantId: id,
      error: error instanceof Error ? error.message : String(error),
      status: error.response?.status,
    });
    const errorData = error.response?.data;
    const errorMessage = errorData?.error?.message || errorData?.message || 'Failed to link store';
    return NextResponse.json(
      { message: errorMessage, code: errorData?.error?.code },
      { status: error.response?.status || 500 }
    );
  }
}
