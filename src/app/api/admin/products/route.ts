import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { connect } from '@/lib/connect';
import Product from '@/models/Product';

/**
 * GET: All products for Admin/Support oversight
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // e.g., flagged, inactive

    const filter: any = {};
    if (status === 'flagged') filter.isFlagged = true;
    if (status === 'inactive') filter.isActive = false;

    const products = await Product.find(filter)
      .populate('merchantId', 'storeName ownerName')
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: products }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch products for oversight', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Moderation actions (Flag/Delete)
 */
export async function PATCH(req: NextRequest) {
  try {
     const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ message: 'Only admins can moderate products' }, { status: 403 });
    }

    await connect();
    const { productId, action, reason } = await req.json();

    if (action === 'flag') {
      await Product.findByIdAndUpdate(productId, { isFlagged: true, rejectionReason: reason });
    } else if (action === 'unflag') {
      await Product.findByIdAndUpdate(productId, { isFlagged: false });
    } else if (action === 'deactivate') {
      await Product.findByIdAndUpdate(productId, { isActive: false });
    }

    return NextResponse.json({ success: true, message: `Product ${action} successfully` });

  } catch (error: any) {
    return NextResponse.json({ message: 'Moderation failed', error: error.message }, { status: 500 });
  }
}
