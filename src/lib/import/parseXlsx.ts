/**
 * XLSX Parsing Utility for Bulk Product Import
 * Uses xlsx library for parsing Excel files
 */

import * as XLSX from 'xlsx';
import { ImportRowRaw } from './types';

interface ParseXlsxResult {
  rows: ImportRowRaw[];
  headers: string[];
  errors: string[];
  sheetName: string;
}

/**
 * Parse XLSX buffer into structured rows
 */
export function parseXlsx(buffer: Buffer): ParseXlsxResult {
  const errors: string[] = [];
  
  try {
    // Read workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return { rows: [], headers: [], errors: ['No sheets found in Excel file'], sheetName: '' };
    }
    
    const sheetName = sheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false, // Get formatted strings
      defval: '', // Default value for empty cells
    });
    
    if (jsonData.length === 0) {
      return { rows: [], headers: [], errors: ['Sheet is empty'], sheetName };
    }
    
    // Get headers from first row keys
    const headers = Object.keys(jsonData[0] || {}).map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['sku', 'name', 'price'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      return { rows: [], headers, errors, sheetName };
    }
    
    // Convert to ImportRowRaw format
    const rows: ImportRowRaw[] = jsonData.map(row => {
      const normalizedRow: ImportRowRaw = {} as ImportRowRaw;
      
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = key.trim().toLowerCase();
        normalizedRow[normalizedKey] = value !== null && value !== undefined 
          ? String(value).trim() 
          : '';
      });
      
      // Ensure required fields exist
      normalizedRow.sku = normalizedRow.sku ?? '';
      normalizedRow.name = normalizedRow.name ?? '';
      normalizedRow.price = normalizedRow.price ?? '';
      
      return normalizedRow;
    });
    
    return { rows, headers, errors, sheetName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing Excel file';
    return { rows: [], headers: [], errors: [errorMessage], sheetName: '' };
  }
}

/**
 * Generate XLSX buffer from rows
 */
export function generateXlsx(headers: string[], rows: Record<string, string | number | undefined>[]): Buffer {
  // Create worksheet data with headers
  const wsData = [
    headers,
    ...rows.map(row => headers.map(h => row[h] ?? ''))
  ];
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths based on header length
  const colWidths = headers.map(h => ({
    wch: Math.max(h.length + 2, 15)
  }));
  worksheet['!cols'] = colWidths;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  // Write to buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

/**
 * Create a template XLSX with headers and example row
 */
export function createTemplateXlsx(): Buffer {
  const headers = [
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
  
  const exampleUrlRow = {
    sku: 'PROD-001',
    name: 'Example Product',
    description: 'A sample product description',
    price: 99.99,
    currency: 'USD',
    category: 'Electronics',
    stock: 100,
    image_urls: 'https://example.com/img1.jpg|https://example.com/img2.jpg',
    image_files: '',
    variants_json: ''
  };
  
  const exampleZipRow = {
    sku: 'PROD-002',
    name: 'Product with ZIP Images',
    description: 'Product using images from ZIP file',
    price: 149.99,
    currency: 'USD',
    category: 'Clothing',
    stock: 50,
    image_urls: '',
    image_files: 'product2-front.jpg|product2-back.jpg',
    variants_json: JSON.stringify([
      { sku: 'PROD-002-S', attributes: { size: 'S' }, merchantPrice: 149.99, stock: 20 },
      { sku: 'PROD-002-M', attributes: { size: 'M' }, merchantPrice: 149.99, stock: 30 }
    ])
  };
  
  return generateXlsx(headers, [exampleUrlRow, exampleZipRow]);
}
