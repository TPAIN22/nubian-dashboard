/**
 * POST /api/merchants/stores
 *
 * Create a store on a merchant's behalf (proxies to backend admin endpoint).
 * Static segment, so it takes precedence over /api/merchants/[id].
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { axiosInstance } from '@/lib/axiosInstance';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await axiosInstance.post('/merchants/admin/stores', body, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const responseData = response.data?.data || response.data;
    return NextResponse.json(responseData, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating store for merchant', {
      error: error instanceof Error ? error.message : String(error),
      status: error.response?.status,
    });
    const errorData = error.response?.data;
    const errorMessage = errorData?.error?.message || errorData?.message || 'Failed to create store';
    return NextResponse.json(
      { message: errorMessage, code: errorData?.error?.code },
      { status: error.response?.status || 500 }
    );
  }
}
