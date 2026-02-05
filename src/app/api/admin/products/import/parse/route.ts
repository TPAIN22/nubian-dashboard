/**
 * POST /api/admin/products/import/parse
 * 
 * Parse CSV/XLSX file and optional ZIP, validate, return preview
 */

import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import logger from '@/lib/logger';
import {
  parseCsv,
  parseXlsx,
  validateRows,
  validateMerchantAccess,
  getZipFileList,
  createSession,
  PREVIEW_ROWS_COUNT,
  ParseResponse,
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
    
    // Fetch from Clerk if not in session claims
    if (!role) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        role = (user.publicMetadata as any)?.role || (user.privateMetadata as any)?.role;
      } catch (error) {
        logger.error('Failed to fetch user role', { userId, error });
      }
    }
    
    // Get user's merchantId if they are a merchant
    let userMerchantId: string | undefined;
    if (role === 'merchant') {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        userMerchantId = (user.publicMetadata as any)?.merchantId || 
                         (user.privateMetadata as any)?.merchantId;
      } catch (error) {
        logger.error('Failed to fetch merchant ID', { userId, error });
      }
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    const dataFile = formData.get('dataFile') as File | null;
    const zipFile = formData.get('zipFile') as File | null;
    const merchantId = formData.get('merchantId') as string | null;
    
    // Validate merchant ID
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      );
    }
    
    // Check merchant access
    const accessCheck = validateMerchantAccess(role, userMerchantId, merchantId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, error: accessCheck.error || 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Validate data file
    if (!dataFile) {
      return NextResponse.json(
        { success: false, error: 'dataFile is required (CSV or XLSX)' },
        { status: 400 }
      );
    }
    
    const fileName = dataFile.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isXlsx = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCsv && !isXlsx) {
      return NextResponse.json(
        { success: false, error: 'File must be CSV or XLSX format' },
        { status: 400 }
      );
    }
    
    // Read data file
    const dataBuffer = Buffer.from(await dataFile.arrayBuffer());
    
    // Parse data file
    let parseResult;
    if (isCsv) {
      const content = dataBuffer.toString('utf-8');
      const { rows, errors } = parseCsv(content);
      
      if (errors.length > 0) {
        return NextResponse.json(
          { success: false, error: 'CSV parsing failed', details: errors },
          { status: 400 }
        );
      }
      
      parseResult = { rows, headers: [] };
    } else {
      const { rows, errors } = parseXlsx(dataBuffer);
      
      if (errors.length > 0) {
        return NextResponse.json(
          { success: false, error: 'XLSX parsing failed', details: errors },
          { status: 400 }
        );
      }
      
      parseResult = { rows, headers: [] };
    }
    
    // Process ZIP file if provided
    let zipBuffer: Buffer | undefined;
    let zipFiles: Map<string, { filename: string; size: number }> | undefined;
    
    if (zipFile) {
      zipBuffer = Buffer.from(await zipFile.arrayBuffer());
      const { files, errors } = await getZipFileList(zipBuffer);
      
      if (errors.length > 0) {
        return NextResponse.json(
          { success: false, error: 'ZIP processing failed', details: errors },
          { status: 400 }
        );
      }
      
      zipFiles = files;
      
      logger.info('ZIP file processed', {
        filename: zipFile.name,
        fileCount: files.size,
        totalSize: zipBuffer.length
      });
    }
    
    // Validate rows
    const validationResult = validateRows(parseResult.rows, {
      zipFiles,
      existingSkusInFile: new Set()
    });
    
    // Create session to store parsed data
    const session = createSession(
      merchantId,
      userId,
      validationResult,
      zipBuffer
    );
    
    // Prepare preview (first N rows)
    const preview = validationResult.rows.slice(0, PREVIEW_ROWS_COUNT);
    
    const response: ParseResponse = {
      success: true,
      sessionId: session.id,
      preview,
      totalRows: validationResult.totalRows,
      validRows: validationResult.validRows,
      invalidRows: validationResult.invalidRows,
      mode: validationResult.mode,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      duplicateSkus: validationResult.duplicateSkus
    };
    
    logger.info('Parse completed successfully', {
      sessionId: session.id,
      merchantId,
      totalRows: validationResult.totalRows,
      validRows: validationResult.validRows,
      mode: validationResult.mode
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('Parse endpoint error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
