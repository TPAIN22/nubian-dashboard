/**
 * PATCH /api/merchants/stores/[id]
 *
 * Edit an admin-created store. The backend rejects the request once the store
 * has been claimed by a registered merchant.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { axiosInstance } from '@/lib/axiosInstance';
import logger from '@/lib/logger';

export async function PATCH(
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

    const response = await axiosInstance.patch(`/merchants/admin/stores/${id}`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const responseData = response.data?.data || response.data;
    return NextResponse.json(responseData);
  } catch (error: any) {
    logger.error('Error updating store', {
      merchantId: id,
      error: error instanceof Error ? error.message : String(error),
      status: error.response?.status,
    });
    const errorData = error.response?.data;
    const errorMessage = errorData?.error?.message || errorData?.message || 'Failed to update store';
    return NextResponse.json(
      { message: errorMessage, code: errorData?.error?.code },
      { status: error.response?.status || 500 }
    );
  }
}
