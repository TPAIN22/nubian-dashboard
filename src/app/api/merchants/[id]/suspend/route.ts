import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { axiosInstance } from '@/lib/axiosInstance';
import logger from '@/lib/logger';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let merchantId: string | undefined;
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
    merchantId = id;

    // Parse request body safely
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.error('Error parsing request body', { 
        merchantId: id,
        error: parseError instanceof Error ? parseError.message : String(parseError)
      });
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { suspensionReason } = body;

    if (!suspensionReason || !suspensionReason.trim()) {
      return NextResponse.json(
        { message: 'Suspension reason is required' },
        { status: 400 }
      );
    }

    logger.info('Suspending merchant', { merchantId: id, hasReason: !!suspensionReason });

    // Call the proper suspend endpoint - backend has this endpoint at PATCH /api/merchants/:id/suspend
    const response = await axiosInstance.patch(
      `/merchants/${id}/suspend`,
      { suspensionReason: suspensionReason.trim() },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    logger.info('Merchant suspended successfully', { merchantId: id });
    // Handle standardized response format: { success: true, data: {...}, message: "..." }
    const responseData = response.data?.data || response.data;
    return NextResponse.json(responseData);
  } catch (error: any) {
    logger.error('Error suspending merchant', { 
      merchantId: merchantId,
      error: error instanceof Error ? error.message : String(error),
      status: error.response?.status,
      responseData: error.response?.data,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle axios errors with standardized error format
    if (error.response) {
      const errorData = error.response.data;
      const errorMessage = errorData?.error?.message || errorData?.message || errorData?.error || 'Failed to suspend merchant';
      return NextResponse.json(
        { 
          message: errorMessage,
          error: errorData?.error?.code || 'SUSPEND_ERROR',
          details: errorData?.error?.details || errorData?.details
        },
        { status: error.response.status || 500 }
      );
    }
    
    // Handle network errors
    if (error.request) {
      return NextResponse.json(
        { message: 'Network error: Could not reach the server' },
        { status: 503 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { message: error.message || 'Failed to suspend merchant' },
      { status: 500 }
    );
  }
}

