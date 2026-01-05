import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { axiosInstance } from '@/lib/axiosInstance';
import logger from '@/lib/logger';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const response = await axiosInstance.patch(
      `/merchants/${id}/approve`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    const { id } = await params;
    logger.error('Error approving merchant', { 
      merchantId: id,
      error: error instanceof Error ? error.message : String(error),
      status: error.response?.status 
    });
    return NextResponse.json(
      { message: error.response?.data?.message || 'Failed to approve merchant' },
      { status: error.response?.status || 500 }
    );
  }
}

