/**
 * GET /api/admin/products/import/template.csv
 * 
 * Download CSV template for bulk product import
 */

import { NextResponse } from 'next/server';
import { generateCsv, IMPORT_COLUMNS } from '@/lib/import';

// Single source of column order, shared with the XLSX template and the parser.
const HEADERS = [...IMPORT_COLUMNS];

/** Blank discount columns — a row that doesn't mention a sale leaves it alone. */
const NO_DISCOUNT = {
  merchant_discount: '',
  discount_type: '',
  discount_value: '',
  discount_max: '',
  discount_starts_at: '',
  discount_ends_at: '',
  discount_active: ''
};

const EXAMPLE_ROWS = [
  {
    sku: 'PROD-001',
    name: 'Example Product (URL Mode)',
    description: 'A sample product with image URLs',
    price: '99.99',
    currency: 'USD',
    category: 'Electronics',
    stock: '100',
    image_urls: 'https://example.com/img1.jpg|https://example.com/img2.jpg',
    image_files: '',
    variants_json: '',
    ...NO_DISCOUNT
  },
  {
    sku: 'PROD-002',
    name: 'Example Product (ZIP Mode)',
    description: 'A sample product with images from ZIP file',
    price: '149.99',
    currency: 'USD',
    category: 'Clothing',
    stock: '50',
    image_urls: '',
    image_files: 'product2-front.jpg|product2-back.jpg',
    variants_json: '',
    // 15% off every variant, capped at 20, running for a fixed window.
    merchant_discount: '',
    discount_type: 'percentage',
    discount_value: '15',
    discount_max: '20',
    discount_starts_at: '2026-01-01T00:00:00Z',
    discount_ends_at: '2026-01-31T23:59:59Z',
    discount_active: 'true'
  },
  {
    sku: 'PROD-003',
    name: 'Product with Variants',
    description: 'A product demonstrating variant structure',
    price: '199.99',
    currency: 'USD',
    category: 'Clothing',
    stock: '0',
    image_urls: 'https://example.com/prod3.jpg',
    image_files: '',
    // merchantDiscount inside variants_json is an ABSOLUTE amount off that
    // variant — not a percentage. It stacks with the product-level discount.
    variants_json: JSON.stringify([
      { sku: 'PROD-003-S-RED', attributes: { size: 'S', color: 'Red' }, merchantPrice: 199.99, merchantDiscount: 0, stock: 10 },
      { sku: 'PROD-003-M-RED', attributes: { size: 'M', color: 'Red' }, merchantPrice: 199.99, merchantDiscount: 10, stock: 15 },
      { sku: 'PROD-003-L-BLUE', attributes: { size: 'L', color: 'Blue' }, merchantPrice: 209.99, merchantDiscount: 0, stock: 8 }
    ]),
    // Fixed 25 off every variant, no schedule (live immediately, no end date).
    merchant_discount: '',
    discount_type: 'fixed',
    discount_value: '25',
    discount_max: '',
    discount_starts_at: '',
    discount_ends_at: '',
    discount_active: 'true'
  }
];

export async function GET() {
  const csvContent = generateCsv(HEADERS, EXAMPLE_ROWS);
  
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="product-import-template.csv"',
      'Cache-Control': 'public, max-age=86400' // Cache for 1 day
    }
  });
}
