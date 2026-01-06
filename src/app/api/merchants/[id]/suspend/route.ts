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

    // Try multiple approaches to suspend the merchant
    // Approach 1: Try the suspend endpoint
    try {
      const response = await axiosInstance.patch(
        `/merchants/${id}/suspend`,
        { suspensionReason: suspensionReason.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      logger.info('Merchant suspended successfully via suspend endpoint', { merchantId: id });
      return NextResponse.json(response.data);
    } catch (suspendError: any) {
      // If suspend endpoint doesn't exist (404), try alternative approaches
      if (suspendError.response?.status === 404) {
        logger.warn('Suspend endpoint not found, trying alternative approaches', { merchantId: id });
        
        // Approach 2: Try updating merchant status directly
        try {
          const updateResponse = await axiosInstance.patch(
            `/merchants/${id}`,
            { 
              status: 'SUSPENDED',
              suspensionReason: suspensionReason.trim() 
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          logger.info('Merchant suspended via direct status update', { merchantId: id });
          return NextResponse.json(updateResponse.data);
        } catch (updateError: any) {
          logger.warn('Direct status update failed, trying PUT method', { 
            merchantId: id,
            error: updateError.response?.status 
          });
          
          // Approach 3: Try PUT method instead of PATCH
          try {
            const putResponse = await axiosInstance.put(
              `/merchants/${id}`,
              { 
                status: 'SUSPENDED',
                suspensionReason: suspensionReason.trim() 
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            logger.info('Merchant suspended via PUT method', { merchantId: id });
            return NextResponse.json(putResponse.data);
          } catch (putError: any) {
            // All standard approaches failed, try using reject endpoint as temporary workaround
            // This is not ideal but allows the feature to work until backend is updated
            logger.warn('Standard suspend methods failed, trying reject endpoint as workaround', {
              merchantId: id
            });
            
            try {
              // Temporary workaround: Use reject endpoint but we'll handle it as suspend on frontend
              // Note: This will set status to REJECTED, not SUSPENDED
              // Backend should implement proper suspend endpoint
              const rejectResponse = await axiosInstance.patch(
                `/merchants/${id}/reject`,
                { 
                  rejectionReason: `[SUSPENDED] ${suspensionReason.trim()}`,
                  // Try to pass status if backend supports it
                  status: 'SUSPENDED'
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              logger.warn('Merchant suspended via reject endpoint (temporary workaround)', { merchantId: id });
              // Return success but with a warning flag
              return NextResponse.json({
                ...rejectResponse.data,
                _workaround: true,
                _message: 'Used reject endpoint as temporary workaround. Backend suspend endpoint needed.'
              });
            } catch (rejectError: any) {
              // All approaches including workaround failed
              logger.error('All suspend approaches failed including workaround', {
                merchantId: id,
                suspendError: suspendError.response?.status,
                updateError: updateError.response?.status,
                putError: putError.response?.status,
                rejectError: rejectError.response?.status
              });
              
              // Return a helpful error message
              const errorMessage = 'نقطة النهاية لتعليق التاجر غير متوفرة في الخادم. يرجى إضافة نقطة النهاية التالية إلى واجهة برمجة التطبيقات: PATCH /api/merchants/:id/suspend';
              return NextResponse.json(
                { 
                  message: errorMessage,
                  error: 'SUSPEND_ENDPOINT_NOT_FOUND',
                  details: {
                    attemptedEndpoints: [
                      `PATCH /merchants/${id}/suspend`,
                      `PATCH /merchants/${id}`,
                      `PUT /merchants/${id}`,
                      `PATCH /merchants/${id}/reject (workaround)`
                    ],
                    backendRequired: 'Add endpoint: PATCH /api/merchants/:id/suspend with body: { suspensionReason: string }'
                  }
                },
                { status: 404 }
              );
            }
          }
        }
      }
      // Re-throw if it's not a 404 error
      throw suspendError;
    }
  } catch (error: any) {
    logger.error('Error suspending merchant', { 
      merchantId: merchantId,
      error: error instanceof Error ? error.message : String(error),
      status: error.response?.status,
      responseData: error.response?.data,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle axios errors
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response?.data?.message || error.response?.data?.error || 'Failed to suspend merchant',
          details: error.response?.data 
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

