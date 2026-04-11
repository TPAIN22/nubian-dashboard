/**
 * Excel Parsing Utility for Bulk Product Import
 * Uses exceljs library for secure and efficient parsing
 */

import * as ExcelJS from 'exceljs';
import { ImportRowRaw } from './types';

interface ParseXlsxResult {
  rows: ImportRowRaw[];
  headers: string[];
  errors: string[];
  sheetName: string;
}

/**
 * Parse Excel buffer into structured rows using async loading
 */
export async function parseXlsx(buffer: Buffer): Promise<ParseXlsxResult> {
  const errors: string[] = [];
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    // Get first sheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { rows: [], headers: [], errors: ['No sheets found in Excel file'], sheetName: '' };
    }
    
    const sheetName = worksheet.name;
    
    if (worksheet.rowCount === 0) {
      return { rows: [], headers: [], errors: ['Sheet is empty'], sheetName };
    }

    // Get headers
    const headers: string[] = [];
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
      headers[colNumber - 1] = String(cell.value || '').trim().toLowerCase();
    });

    if (headers.length === 0) {
      return { rows: [], headers: [], errors: ['Could not read headers from the first row'], sheetName };
    }

    // Validate required headers
    const requiredHeaders = ['sku', 'name', 'price'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      return { rows: [], headers, errors, sheetName };
    }

    const rows: ImportRowRaw[] = [];

    // Parse data rows
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber === 1) return; // Skip header
      
      const normalizedRow: ImportRowRaw = {} as ImportRowRaw;
      let hasData = false;

      headers.forEach((header, index) => {
        if (!header) return;
        const cellValue = row.getCell(index + 1).value;
        
        let valueStr = '';
        if (cellValue !== null && cellValue !== undefined) {
          // Handle rich text, dates, numbers, etc.
          if (typeof cellValue === 'object') {
            if ('richText' in cellValue) {
              valueStr = cellValue.richText.map((rt: any) => rt.text).join('').trim();
            } else if (cellValue instanceof Date) {
              valueStr = cellValue.toISOString();
            } else if ('text' in cellValue) { // Hyperlink
              valueStr = cellValue.text?.trim() || '';
            } else {
              valueStr = String(cellValue).trim();
            }
          } else {
            valueStr = String(cellValue).trim();
          }
        }

        if (valueStr !== '') hasData = true;
        normalizedRow[header as keyof ImportRowRaw] = valueStr;
      });

      if (hasData) {
        // Ensure required fields exist even if empty
        normalizedRow.sku = normalizedRow.sku ?? '';
        normalizedRow.name = normalizedRow.name ?? '';
        normalizedRow.price = normalizedRow.price ?? '';
        rows.push(normalizedRow);
      }
    });

    return { rows, headers, errors, sheetName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing Excel file';
    return { rows: [], headers: [], errors: [errorMessage], sheetName: '' };
  }
}

/**
 * Generate Excel buffer from rows
 */
export async function generateXlsx(headers: string[], rows: Record<string, string | number | undefined>[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');

  // Add Headers
  worksheet.columns = headers.map(h => ({
    header: h,
    key: h,
    width: Math.max(h.length + 2, 15)
  }));
  
  // Make header row bold
  worksheet.getRow(1).font = { bold: true };

  // Add Rows
  rows.forEach(row => {
    worksheet.addRow(row);
  });

  // Write to Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  // writeBuffer returns ArrayBuffer in browser but Buffer in Node, we cast it
  return Buffer.from(buffer);
}

/**
 * Create a template Excel file with headers and example rows
 */
export async function createTemplateXlsx(): Promise<Buffer> {
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
