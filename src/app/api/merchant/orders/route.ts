import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/connect';
import Order from '@/models/Order';
import MerchantApplication from '@/models/MerchantApplication';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connect();

    // 1. Get the merchant ID associated with this clerk user
    const merchant = await MerchantApplication.findOne({ userId, status: 'approved' });
    if (!merchant) {
      return NextResponse.json({ message: 'Merchant not approved or not found' }, { status: 403 });
    }

    // 2. Fetch orders for this merchant
    const orders = await Order.find({ merchantId: merchant._id })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: orders
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching merchant orders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch orders', error: error.message },
      { status: 500 }
    );
  }
}
