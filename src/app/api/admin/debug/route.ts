import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { connect } from '@/lib/connect';

/**
 * GET: Diagnostic endpoint to trace admin auth issues
 * Remove after debugging
 */
export async function GET(req: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
      hasClerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
    auth: null,
    dbConnection: null,
    error: null,
  };

  try {
    const { userId, sessionClaims } = await auth();
    results.auth = {
      userId: userId ? `${userId.slice(0, 8)}...` : null,
      role: (sessionClaims as any)?.publicMetadata?.role || 'not in claims',
    };
  } catch (e: any) {
    results.auth = { error: e.message };
  }

  try {
    await connect();
    results.dbConnection = 'ok';
  } catch (e: any) {
    results.dbConnection = { error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
