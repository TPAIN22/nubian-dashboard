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

    // 1. Get the merchant ID
    const merchant = await MerchantApplication.findOne({ userId, status: 'approved' });
    if (!merchant) {
      return NextResponse.json({ message: 'Merchant not approved or not found' }, { status: 403 });
    }

    // 2. Aggregate stats
    const stats = await Order.aggregate([
      { $match: { merchantId: merchant._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          processingCount: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
          shippedCount: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
          deliveredCount: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          deliveredRevenue: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] } },
          shippedRevenue: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, '$totalAmount', 0] } },
          processingRevenue: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, '$totalAmount', 0] } },
          pendingRevenue: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0] } },
        }
      }
    ]);

    const data = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingCount: 0,
      processingCount: 0,
      shippedCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      deliveredRevenue: 0,
      shippedRevenue: 0,
      processingRevenue: 0,
      pendingRevenue: 0,
    };

    // Return in the format expected by the merchant dashboard
    return NextResponse.json({
      totalOrders: data.totalOrders,
      totalRevenue: data.totalRevenue,
      statusStats: {
        pending: data.pendingCount,
        confirmed: data.processingCount, // 'processing' mapped to 'confirmed' in UI
        shipped: data.shippedCount,
        delivered: data.deliveredCount,
        cancelled: data.cancelledCount,
      },
      revenueByStatus: {
        pending: data.pendingRevenue,
        confirmed: data.processingRevenue,
        shipped: data.shippedRevenue,
        delivered: data.deliveredRevenue,
        cancelled: 0,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching merchant stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard stats', error: error.message },
      { status: 500 }
    );
  }
}
