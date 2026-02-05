/**
 * GET /api/merchants
 * 
 * Fetch list of merchants (proxies to backend API)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { axiosInstance } from '@/lib/axiosInstance';
import logger from '@/lib/logger';

export async function GET() {
  try {
    // Authenticate
    const { getToken } = await auth();
    const token = await getToken();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch merchants from backend
    const response = await axiosInstance.get('/merchants', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Handle different response structures from backend
    let merchants = [];
    
    if (response.data?.success && Array.isArray(response.data?.data)) {
      merchants = response.data.data;
    } else if (Array.isArray(response.data?.merchants)) {
      merchants = response.data.merchants;
    } else if (Array.isArray(response.data)) {
      merchants = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      merchants = response.data.data;
    }
    
    return NextResponse.json({
      success: true,
      data: merchants,
    });
    
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
    
    logger.error('Failed to fetch merchants', {
      error: axiosError.message || 'Unknown error',
      status: axiosError.response?.status,
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: axiosError.response?.data?.message || 'Failed to fetch merchants' 
      },
      { status: axiosError.response?.status || 500 }
    );
  }
}
