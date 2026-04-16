import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/connect';
import Product from '@/models/Product';
import MerchantApplication from '@/models/MerchantApplication';
import slugify from 'slugify';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connect();
    const body = await req.json();

    // Verify merchant status
    const merchant = await MerchantApplication.findOne({ userId, status: 'approved' });
    if (!merchant) {
      return NextResponse.json({ success: false, message: 'Only approved merchants can create products' }, { status: 403 });
    }

    const { name, description, price, stock, images, category, attributes } = body;

    const baseSlug = slugify(name, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now()}`;

    const product = await Product.create({
      merchantId: merchant._id,
      name,
      slug,
      description,
      price,
      stock,
      images,
      category,
      attributes,
      isActive: true
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });

  } catch (error: any) {
    console.error('API Product POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create product', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    const filter: any = { isActive: true };
    if (category) filter.category = category;
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products', error: error.message },
      { status: 500 }
    );
  }
}
