import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { connect } from '@/lib/connect';
import Product from '@/models/Product';
import Order from '@/models/Order';
import MerchantApplication from '@/models/MerchantApplication';

/**
 * GET: Global Analytics for Admin
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user.publicMetadata?.role;

    if (role !== 'admin' && role !== 'support') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connect();

    const totalMerchants = await MerchantApplication.countDocuments({ status: 'approved' });
    const pendingMerchants = await MerchantApplication.countDocuments({ status: 'pending' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const salesAggregate = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalMerchants,
        pendingMerchants,
        totalProducts,
        totalOrders,
        totalRevenue: salesAggregate[0]?.totalSales || 0
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Admin Analytics error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch analytics', error: error.message },
      { status: 500 }
    );
  }
}
