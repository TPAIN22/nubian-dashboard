/**
 * POST /api/admin/products/import/commit
 * 
 * Commit a validated import session to MongoDB
 */

import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import logger from '@/lib/logger';
import {
  getSession,
  updateSessionStatus,
  deleteSession,
  validateSessionAccess,
  commitImport,
  getCategoryMap,
  getDefaultCategoryId,
  CommitResponse,
} from '@/lib/import';

export async function POST(request: Request) {
  try {
    // Authenticate
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user role
    let role = (sessionClaims as any)?.publicMetadata?.role || 
               (sessionClaims as any)?.privateMetadata?.role;
    
    if (!role) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        role = (user.publicMetadata as any)?.role || (user.privateMetadata as any)?.role;
      } catch (error) {
        logger.error('Failed to fetch user role', { userId, error });
      }
    }
    
    // Parse request body
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }
    
    // Get session
    const session = getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found or expired' },
        { status: 404 }
      );
    }
    
    // Validate session access
    const accessCheck = validateSessionAccess(session, userId, role);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, error: accessCheck.error || 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Check session status
    if (session.status === 'committed') {
      return NextResponse.json(
        { success: false, error: 'Session has already been committed' },
        { status: 400 }
      );
    }
    
    if (session.status === 'expired') {
      return NextResponse.json(
        { success: false, error: 'Session has expired' },
        { status: 400 }
      );
    }
    
    // Update session status to prevent double commits
    updateSessionStatus(sessionId, 'committed');
    
    logger.info('Starting commit', {
      sessionId,
      merchantId: session.merchantId,
      totalRows: session.parseResult.totalRows,
      validRows: session.parseResult.validRows,
      mode: session.parseResult.mode
    });
    
    // Get category map for resolving category names to IDs
    let categoryMap: Map<string, string> | undefined;
    let defaultCategoryId: string | undefined;
    
    try {
      categoryMap = await getCategoryMap();
      logger.info('Loaded category map', { count: categoryMap.size });
    } catch (error) {
      logger.warn('Failed to load category map, categories will be skipped', { error });
    }
    
    // Get default category ID as fallback (category is required in backend)
    try {
      defaultCategoryId = await getDefaultCategoryId();
      if (defaultCategoryId) {
        logger.info('Loaded default category', { defaultCategoryId });
      } else {
        logger.warn('No default category found - products without valid category will fail');
      }
    } catch (error) {
      logger.warn('Failed to get default category', { error });
    }
    
    // Commit import
    const result = await commitImport({
      merchantId: session.merchantId,
      rows: session.parseResult.rows,
      mode: session.parseResult.mode,
      zipBuffer: session.zipBuffer,
      categoryMap,
      defaultCategoryId
    });
    
    logger.info('Commit completed', {
      sessionId,
      merchantId: session.merchantId,
      insertedCount: result.insertedCount,
      updatedCount: result.updatedCount,
      failedCount: result.failedCount,
      uploadedImages: result.uploadedImages
    });
    
    // Clean up session (keep for a bit in case client needs to re-fetch)
    // In production, you might want to keep the session briefly for error recovery
    setTimeout(() => {
      deleteSession(sessionId);
    }, 60000); // Delete after 1 minute
    
    const response: CommitResponse = {
      success: result.failedCount === 0,
      result
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('Commit endpoint error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
