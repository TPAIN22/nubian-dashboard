/**
 * GET /api/merchants/[id]/claim-candidates
 *
 * Registered users whose email matches an unclaimed store. Read-only — linking
 * is a separate, explicit admin action.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { axiosInstance } from '@/lib/axiosInstance';
import logger from '@/lib/logger';

export async function GET(
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

    const email = new URL(request.url).searchParams.get('email');

    const response = await axiosInstance.get(`/merchants/${id}/claim-candidates`, {
      headers: { Authorization: `Bearer ${token}` },
      params: email ? { email } : undefined,
    });

    const responseData = response.data?.data || response.data;
    return NextResponse.json(responseData);
  } catch (error: any) {
    logger.error('Error fetching claim candidates', {
      merchantId: id,
      error: error instanceof Error ? error.message : String(error),
      status: error.response?.status,
    });
    const errorData = error.response?.data;
    const errorMessage = errorData?.error?.message || errorData?.message || 'Failed to fetch claim candidates';
    return NextResponse.json(
      { message: errorMessage, code: errorData?.error?.code },
      { status: error.response?.status || 500 }
    );
  }
}
