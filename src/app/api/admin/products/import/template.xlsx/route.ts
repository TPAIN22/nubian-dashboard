/**
 * GET /api/admin/products/import/template.xlsx
 * 
 * Download XLSX template for bulk product import
 */

import { NextResponse } from 'next/server';
import { createTemplateXlsx } from '@/lib/import';

export async function GET() {
  const xlsxBuffer = createTemplateXlsx();
  
  // Convert Buffer to Uint8Array for NextResponse compatibility
  const uint8Array = new Uint8Array(xlsxBuffer);
  
  return new NextResponse(uint8Array, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="product-import-template.xlsx"',
      'Cache-Control': 'public, max-age=86400' // Cache for 1 day
    }
  });
}
