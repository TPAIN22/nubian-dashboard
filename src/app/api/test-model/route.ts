import { NextResponse } from 'next/server';
import { connect } from '@/lib/connect';
import MerchantApplication from '@/models/MerchantApplication';

export async function POST(req) {
  try {
    await connect();
    const body = await req.json();
    const application = new MerchantApplication({ ...body, userId: 'test_user_from_postman' });
    await application.save();
    return NextResponse.json({ success: true, id: application._id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack, name: err.name }, { status: 500 });
  }
}
