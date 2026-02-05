/**
 * POST /api/admin/products/import/failures
 * 
 * Generate downloadable failures report (CSV)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateCsv, FailedRow } from '@/lib/import';

export async function POST(request: Request) {
  try {
    // Authenticate
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { failures, format = 'csv' } = body as {
      failures: FailedRow[];
      format?: 'csv' | 'json';
    };
    
    if (!failures || !Array.isArray(failures)) {
      return NextResponse.json(
        { success: false, error: 'failures array is required' },
        { status: 400 }
      );
    }
    
    if (format === 'json') {
      // Return JSON format
      return new NextResponse(JSON.stringify(failures, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="import-failures.json"'
        }
      });
    }
    
    // Generate CSV
    const headers = ['row', 'sku', 'name', 'reason', 'errors'];
    const rows = failures.map(f => ({
      row: String(f.rowIndex + 1), // 1-indexed for users
      sku: f.sku,
      name: f.name,
      reason: f.reason,
      errors: f.errors.map(e => `${e.field}: ${e.message}`).join('; ')
    }));
    
    const csvContent = generateCsv(headers, rows);
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="import-failures.csv"'
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
