import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/connect';
import MerchantApplication from '@/models/MerchantApplication';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connect();

    const application = await MerchantApplication.findOne({ userId }).sort({ createdAt: -1 });

    if (!application) {
      return NextResponse.json({ hasApplication: false }, { status: 200 });
    }

    return NextResponse.json({ 
      hasApplication: true, 
      application 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching merchant status:', error);
    return NextResponse.json(
      { message: 'Failed to fetch status', error: error.message },
      { status: 500 }
    );
  }
}
