/**
 * GET /api/admin/products/import/template.csv
 * 
 * Download CSV template for bulk product import
 */

import { NextResponse } from 'next/server';
import { generateCsv } from '@/lib/import';

const HEADERS = [
  'sku',
  'name',
  'description',
  'price',
  'currency',
  'category',
  'stock',
  'image_urls',
  'image_files',
  'variants_json'
];

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
    variants_json: ''
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
    variants_json: ''
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
    variants_json: JSON.stringify([
      { sku: 'PROD-003-S-RED', attributes: { size: 'S', color: 'Red' }, merchantPrice: 199.99, stock: 10 },
      { sku: 'PROD-003-M-RED', attributes: { size: 'M', color: 'Red' }, merchantPrice: 199.99, stock: 15 },
      { sku: 'PROD-003-L-BLUE', attributes: { size: 'L', color: 'Blue' }, merchantPrice: 209.99, stock: 8 }
    ])
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
