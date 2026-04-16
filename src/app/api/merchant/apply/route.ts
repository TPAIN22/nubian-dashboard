import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/connect';
import MerchantApplication from '@/models/MerchantApplication';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connect();

    // Check if user already has a pending or approved application
    const existingApplication = await MerchantApplication.findOne({
      userId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      return NextResponse.json(
        { message: 'You already have a pending or approved merchant application.' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // In a real app we would apply server-side Zod validation here
    // For now we trust the client-side zod schema and insert directly

    // Check if the user is resubmitting a returned application
    const revisionApplication = await MerchantApplication.findOne({
      userId,
      status: 'needs_revision'
    });

    if (revisionApplication) {
      Object.assign(revisionApplication, body);
      revisionApplication.status = 'pending';
      revisionApplication.revisionNotes = undefined;
      await revisionApplication.save();

      return NextResponse.json(
        { message: 'Merchant application resubmitted successfully', id: revisionApplication._id },
        { status: 200 }
      );
    }

    const application = new MerchantApplication({
      ...body,
      userId
    });
    
    await application.save();

    return NextResponse.json(
      { message: 'Merchant application submitted successfully', id: application._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Merchant registration error:', error);
    return NextResponse.json(
      { message: 'Failed to submit application', error: error.message },
      { status: 500 }
    );
  }
}

