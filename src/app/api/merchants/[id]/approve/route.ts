import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { axiosInstance } from '@/lib/axiosInstance';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
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

    const response = await axiosInstance.patch(
      `/merchants/${params.id}/approve`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error approving merchant:', error);
    return NextResponse.json(
      { message: error.response?.data?.message || 'Failed to approve merchant' },
      { status: error.response?.status || 500 }
    );
  }
}

