/**
 * CSV Parsing Utility for Bulk Product Import
 */

import { ImportRowRaw } from './types';

interface ParseCsvResult {
  rows: ImportRowRaw[];
  headers: string[];
  errors: string[];
}

/**
 * Parse CSV content into structured rows
 * Handles quoted fields, escaped quotes, and various line endings
 */
export function parseCsv(content: string): ParseCsvResult {
  const errors: string[] = [];
  const lines = splitCsvLines(content);
  
  if (lines.length === 0) {
    return { rows: [], headers: [], errors: ['CSV file is empty'] };
  }

  // Parse header row
  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  
  if (headers.length === 0) {
    return { rows: [], headers: [], errors: ['No headers found in CSV'] };
  }

  // Validate required headers
  const requiredHeaders = ['sku', 'name', 'price'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
    return { rows: [], headers, errors };
  }

  // Parse data rows
  const rows: ImportRowRaw[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    const values = parseCsvLine(line);
    
    // Skip rows with no values
    if (values.every(v => !v.trim())) continue;
    
    // Create row object from headers and values
    const row: ImportRowRaw = {} as ImportRowRaw;
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim() ?? '';
      row[header] = value;
    });

    // Ensure required fields exist
    row.sku = row.sku ?? '';
    row.name = row.name ?? '';
    row.price = row.price ?? '';
    
    rows.push(row);
  }

  return { rows, headers, errors };
}

/**
 * Split CSV content into lines, handling quoted fields that may contain newlines
 */
function splitCsvLines(content: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentLine += '""';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !inQuotes) {
      // End of line
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  // Add last line if not empty
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Parse a single CSV line into values
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (!inQuotes) {
        // Start of quoted field
        inQuotes = true;
      } else if (nextChar === '"') {
        // Escaped quote inside quoted field
        currentValue += '"';
        i++;
      } else {
        // End of quoted field
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add last value
  values.push(currentValue);
  
  return values;
}

/**
 * Generate CSV content from rows
 */
export function generateCsv(headers: string[], rows: Record<string, string | number | undefined>[]): string {
  const escapeCsvValue = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    // Escape if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCsvValue).join(',');
  const dataLines = rows.map(row => 
    headers.map(h => escapeCsvValue(row[h])).join(',')
  );
  
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Detect delimiter in CSV content (comma, semicolon, tab)
 */
export function detectDelimiter(content: string): string {
  const firstLine = content.split(/[\r\n]/)[0] || '';
  
  const delimiters = [',', ';', '\t'];
  let maxCount = 0;
  let detectedDelimiter = ',';
  
  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }
  
  return detectedDelimiter;
}
