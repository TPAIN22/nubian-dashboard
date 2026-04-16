import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/connect';
import MerchantApplication from '@/models/MerchantApplication';
import { clerkClient } from '@clerk/nextjs/server';

// GET: List all merchant applications (admin only)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user.publicMetadata?.role as string | undefined;
    if (role !== 'admin' && role !== 'support') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query = status ? { status } : {};

    const applications = await MerchantApplication.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { applications: JSON.parse(JSON.stringify(applications)) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to fetch applications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch applications', error: error.message },
      { status: 500 }
    );
  }
}
