import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { connect } from '@/lib/connect';
import Product from '@/models/Product';
import Order from '@/models/Order';
import MerchantApplication from '@/models/MerchantApplication';

/**
 * GET: Global Analytics for Admin
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Read role from session token first (fast path)
    let role = (sessionClaims as any)?.publicMetadata?.role as string | undefined;

    // Fallback: fetch from Clerk if not in token yet
    if (!role) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        role = user.publicMetadata?.role as string | undefined;
      } catch (clerkErr: any) {
        console.error('Clerk fallback failed:', clerkErr.message);
      }
    }

    if (role !== 'admin' && role !== 'support') {
      return NextResponse.json({ message: 'Forbidden', role }, { status: 403 });
    }

    await connect();

    const [totalMerchants, pendingMerchants, totalProducts, totalOrders, salesAggregate] =
      await Promise.all([
        MerchantApplication.countDocuments({ status: 'approved' }),
        MerchantApplication.countDocuments({ status: 'pending' }),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: 'delivered' } },
          { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
        ])
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
    console.error('[GET /api/admin/analytics]', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch analytics', error: error.message },
      { status: 500 }
    );
  }
}
