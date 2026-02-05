/**
 * Validation Utilities for Bulk Product Import
 */

import {
  ImportRowRaw,
  ImportRowValidated,
  RowError,
  ParseResult,
  ImportMode,
  GlobalError,
  ProductVariantImport,
  MAX_SKU_LENGTH,
  ALLOWED_IMAGE_EXTENSIONS,
} from './types';

interface ValidationContext {
  zipFiles?: Map<string, { filename: string; size: number }>;
  existingSkusInFile: Set<string>;
}

/**
 * Validate all parsed rows and determine import mode
 */
export function validateRows(
  rawRows: ImportRowRaw[],
  context: ValidationContext
): ParseResult {
  const rows: ImportRowValidated[] = [];
  const errors: GlobalError[] = [];
  const warnings: string[] = [];
  const duplicateSkus: string[] = [];
  const seenSkus = new Set<string>();
  
  // Determine import mode from first row with images
  let detectedMode: ImportMode | null = null;
  let hasUrlMode = false;
  let hasZipMode = false;
  
  for (const row of rawRows) {
    const hasImageUrls = !!(row.image_urls || row.image_1 || row.image_2 || row.image_3);
    const hasImageFiles = !!row.image_files;
    
    if (hasImageUrls) hasUrlMode = true;
    if (hasImageFiles) hasZipMode = true;
  }
  
  // Determine mode - ZIP wins if both present
  if (hasZipMode && hasUrlMode) {
    warnings.push('Both URL mode and ZIP mode images detected. ZIP mode will be used, URL columns will be ignored.');
    detectedMode = 'zip';
  } else if (hasZipMode) {
    detectedMode = 'zip';
  } else {
    detectedMode = 'url';
  }
  
  // Validate ZIP is provided if needed
  if (detectedMode === 'zip' && (!context.zipFiles || context.zipFiles.size === 0)) {
    errors.push({
      message: 'ZIP file is required when using image_files column',
      code: 'ZIP_REQUIRED'
    });
  }
  
  // Validate each row
  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i];
    const validated = validateRow(rawRow, i, detectedMode, context);
    
    // Check for duplicate SKUs
    const skuLower = validated.sku.toLowerCase();
    if (seenSkus.has(skuLower)) {
      duplicateSkus.push(validated.sku);
      validated.errors.push({
        field: 'sku',
        message: `Duplicate SKU in file: ${validated.sku}`,
        code: 'DUPLICATE_SKU'
      });
      validated.isValid = false;
    } else if (validated.sku) {
      seenSkus.add(skuLower);
    }
    
    rows.push(validated);
  }
  
  const validRows = rows.filter(r => r.isValid).length;
  const invalidRows = rows.filter(r => !r.isValid).length;
  
  return {
    rows,
    totalRows: rows.length,
    validRows,
    invalidRows,
    mode: detectedMode,
    errors,
    warnings,
    duplicateSkus
  };
}

/**
 * Validate a single row
 */
function validateRow(
  raw: ImportRowRaw,
  rowIndex: number,
  mode: ImportMode,
  context: ValidationContext
): ImportRowValidated {
  const errors: RowError[] = [];
  const warnings: string[] = [];
  
  // Validate SKU
  const sku = String(raw.sku || '').trim();
  if (!sku) {
    errors.push({
      field: 'sku',
      message: 'SKU is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    if (sku.length > MAX_SKU_LENGTH) {
      errors.push({
        field: 'sku',
        message: `SKU must be ${MAX_SKU_LENGTH} characters or less`,
        code: 'SKU_TOO_LONG'
      });
    }
    if (/\s/.test(sku)) {
      errors.push({
        field: 'sku',
        message: 'SKU cannot contain spaces',
        code: 'SKU_INVALID_CHARS'
      });
    }
  }
  
  // Validate name
  const name = String(raw.name || '').trim();
  if (!name) {
    errors.push({
      field: 'name',
      message: 'Name is required',
      code: 'REQUIRED_FIELD'
    });
  }
  
  // Validate price
  const priceValue = parseNumber(raw.price);
  if (priceValue === null || priceValue < 0) {
    errors.push({
      field: 'price',
      message: 'Price must be a non-negative number',
      code: 'INVALID_NUMBER'
    });
  }
  const price = priceValue ?? 0;
  
  // Validate stock
  const stockValue = parseNumber(raw.stock);
  if (stockValue !== null && (stockValue < 0 || !Number.isInteger(stockValue))) {
    errors.push({
      field: 'stock',
      message: 'Stock must be a non-negative integer',
      code: 'INVALID_NUMBER'
    });
  }
  const stock = stockValue !== null ? Math.floor(stockValue) : 0;
  
  // Validate currency
  const currency = String(raw.currency || 'USD').trim().toUpperCase();
  
  // Validate category (required by backend - warn if missing)
  const category = String(raw.category || '').trim();
  if (!category) {
    warnings.push('Category is required - will use default category if available');
  }
  
  // Validate description (required by backend - warn if empty)
  const description = String(raw.description || '').trim();
  if (!description) {
    warnings.push('Description is empty - will use placeholder text');
  }
  
  // Process images based on mode
  let images: string[] = [];
  let imageFiles: string[] | undefined;
  
  if (mode === 'zip') {
    // ZIP mode - validate image files exist
    const fileList = String(raw.image_files || '').trim();
    if (fileList) {
      imageFiles = fileList.split('|').map(f => f.trim()).filter(Boolean);
      
      for (const filename of imageFiles) {
        // Validate extension
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
          errors.push({
            field: 'image_files',
            message: `Invalid image type for ${filename}. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
            code: 'INVALID_FILE_TYPE'
          });
        }
        
        // Check if file exists in ZIP
        if (context.zipFiles && !context.zipFiles.has(filename.toLowerCase())) {
          errors.push({
            field: 'image_files',
            message: `File not found in ZIP: ${filename}`,
            code: 'FILE_NOT_FOUND'
          });
        }
      }
      
      // Placeholder URLs until we upload
      images = imageFiles.map(f => `pending:${f}`);
    }
  } else {
    // URL mode - validate URLs
    const urlList = collectImageUrls(raw);
    
    for (const url of urlList) {
      if (!isValidUrl(url)) {
        errors.push({
          field: 'image_urls',
          message: `Invalid URL: ${url}`,
          code: 'INVALID_URL'
        });
      }
    }
    
    images = urlList.filter(url => isValidUrl(url));
  }
  
  // Warn if no images (required by backend schema)
  if (images.length === 0 && (!imageFiles || imageFiles.length === 0)) {
    errors.push({
      field: 'images',
      message: 'At least one image is required (provide image_urls or image_files)',
      code: 'REQUIRED_FIELD'
    });
  }
  
  // Validate variants JSON
  let variants: ProductVariantImport[] | undefined;
  if (raw.variants_json) {
    try {
      const parsed = JSON.parse(String(raw.variants_json));
      if (!Array.isArray(parsed)) {
        errors.push({
          field: 'variants_json',
          message: 'variants_json must be a JSON array',
          code: 'INVALID_JSON'
        });
      } else {
        // Validate each variant
        variants = [];
        for (let vi = 0; vi < parsed.length; vi++) {
          const v = parsed[vi];
          const variantErrors = validateVariant(v, vi);
          if (variantErrors.length > 0) {
            errors.push(...variantErrors.map(e => ({
              ...e,
              field: `variants_json[${vi}].${e.field}`
            })));
          } else {
            variants.push({
              sku: String(v.sku || '').trim(),
              attributes: v.attributes || {},
              merchantPrice: parseNumber(v.merchantPrice) ?? parseNumber(v.price) ?? price,
              stock: parseNumber(v.stock) ?? 0,
              images: v.images || [],
              isActive: v.isActive !== false
            });
          }
        }
      }
    } catch {
      errors.push({
        field: 'variants_json',
        message: 'variants_json must be valid JSON',
        code: 'INVALID_JSON'
      });
    }
  }
  
  return {
    rowIndex,
    sku,
    name,
    description,
    price,
    currency,
    category,
    stock,
    images,
    imageFiles,
    variants,
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate a variant object
 */
function validateVariant(v: unknown, index: number): RowError[] {
  const errors: RowError[] = [];
  
  if (typeof v !== 'object' || v === null) {
    errors.push({
      field: 'variant',
      message: `Variant ${index} must be an object`,
      code: 'INVALID_JSON'
    });
    return errors;
  }
  
  const variant = v as Record<string, unknown>;
  
  // SKU is optional for variants but must be valid if provided
  const sku = String(variant.sku || '').trim();
  if (sku && sku.length > MAX_SKU_LENGTH) {
    errors.push({
      field: 'sku',
      message: `Variant SKU must be ${MAX_SKU_LENGTH} characters or less`,
      code: 'SKU_TOO_LONG'
    });
  }
  
  // Validate merchantPrice/price if provided
  if (variant.merchantPrice !== undefined) {
    const price = parseNumber(variant.merchantPrice);
    if (price === null || price < 0) {
      errors.push({
        field: 'merchantPrice',
        message: 'Variant merchantPrice must be a non-negative number',
        code: 'INVALID_NUMBER'
      });
    }
  }
  
  // Validate stock if provided
  if (variant.stock !== undefined) {
    const stock = parseNumber(variant.stock);
    if (stock === null || stock < 0) {
      errors.push({
        field: 'stock',
        message: 'Variant stock must be a non-negative number',
        code: 'INVALID_NUMBER'
      });
    }
  }
  
  return errors;
}

/**
 * Collect image URLs from various columns
 */
function collectImageUrls(raw: ImportRowRaw): string[] {
  const urls: string[] = [];
  
  // Check pipe-separated image_urls
  if (raw.image_urls) {
    const list = String(raw.image_urls).split('|').map(u => u.trim()).filter(Boolean);
    urls.push(...list);
  }
  
  // Check individual image columns
  for (let i = 1; i <= 10; i++) {
    const key = `image_${i}`;
    if (raw[key]) {
      urls.push(String(raw[key]).trim());
    }
  }
  
  return urls;
}

/**
 * Validate URL format
 */
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Parse a value as a number
 */
function parseNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(num)) {
    return null;
  }
  
  return num;
}

/**
 * Validate merchant access
 */
export function validateMerchantAccess(
  userRole: string | undefined,
  userMerchantId: string | undefined,
  targetMerchantId: string
): { allowed: boolean; error?: string } {
  // Admin can access any merchant
  if (userRole === 'admin') {
    return { allowed: true };
  }
  
  // Merchant can only access their own
  if (userRole === 'merchant') {
    if (!userMerchantId) {
      return { allowed: false, error: 'Merchant ID not found for user' };
    }
    if (userMerchantId !== targetMerchantId) {
      return { allowed: false, error: 'Cannot import products for another merchant' };
    }
    return { allowed: true };
  }
  
  return { allowed: false, error: 'Unauthorized role' };
}
