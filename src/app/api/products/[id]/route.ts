import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/connect';
import Product from '@/models/Product';
import MerchantApplication from '@/models/MerchantApplication';
import mongoose from 'mongoose';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connect();
    const body = await req.json();

    // Verify ownership
    const merchant = await MerchantApplication.findOne({ userId });
    if (!merchant) {
      return NextResponse.json({ message: 'Merchant not found' }, { status: 403 });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, merchantId: merchant._id },
      { $set: body },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ message: 'Product not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to update product', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connect();
    const merchant = await MerchantApplication.findOne({ userId });
    if (!merchant) {
      return NextResponse.json({ message: 'Merchant not found' }, { status: 403 });
    }

    const product = await Product.findOneAndDelete({ _id: id, merchantId: merchant._id });

    if (!product) {
       return NextResponse.json({ message: 'Product not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to delete product', error: error.message },
      { status: 500 }
    );
  }
}
