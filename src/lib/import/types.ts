/**
 * Types for Bulk Product Import Feature
 */

export type ImportMode = 'url' | 'zip';

export interface ImportRowRaw {
  sku: string;
  name: string;
  description?: string;
  price: string | number;
  currency?: string;
  category?: string;
  stock?: string | number;
  image_urls?: string; // pipe-separated URLs
  image_1?: string;
  image_2?: string;
  image_3?: string;
  image_4?: string;
  image_5?: string;
  image_files?: string; // pipe-separated filenames for ZIP mode
  variants_json?: string;
  [key: string]: string | number | undefined;
}

export interface ImportRowValidated {
  rowIndex: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  images: string[]; // resolved URLs (either from URL mode or placeholders for ZIP mode)
  imageFiles?: string[]; // original filenames for ZIP mode
  variants?: ProductVariantImport[];
  isValid: boolean;
  errors: RowError[];
  warnings: string[];
}

export interface ProductVariantImport {
  sku: string;
  attributes: Record<string, string>;
  merchantPrice: number;
  stock: number;
  images?: string[];
  isActive?: boolean;
}

export interface RowError {
  field: string;
  message: string;
  code: ErrorCode;
}

export type ErrorCode =
  | 'REQUIRED_FIELD'
  | 'INVALID_FORMAT'
  | 'INVALID_NUMBER'
  | 'DUPLICATE_SKU'
  | 'INVALID_URL'
  | 'FILE_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'INVALID_JSON'
  | 'SKU_TOO_LONG'
  | 'SKU_INVALID_CHARS';

export interface ParseResult {
  rows: ImportRowValidated[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  mode: ImportMode;
  errors: GlobalError[];
  warnings: string[];
  duplicateSkus: string[];
}

export interface GlobalError {
  message: string;
  code: string;
}

export interface ImportSession {
  id: string;
  merchantId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  parseResult: ParseResult;
  zipBuffer?: Buffer;
  status: 'pending' | 'committed' | 'expired';
}

export interface CommitResult {
  success: boolean;
  totalRows: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  failures: FailedRow[];
  uploadedImages: number;
}

export interface FailedRow {
  rowIndex: number;
  sku: string;
  name: string;
  reason: string;
  errors: RowError[];
}

// API Request/Response Types
export interface ParseRequestBody {
  merchantId: string;
}

export interface ParseResponse {
  success: boolean;
  sessionId: string;
  preview: ImportRowValidated[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  mode: ImportMode;
  errors: GlobalError[];
  warnings: string[];
  duplicateSkus: string[];
}

export interface CommitRequestBody {
  sessionId: string;
}

export interface CommitResponse {
  success: boolean;
  result: CommitResult;
}

// Template types
export interface TemplateRow {
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  image_urls: string;
  image_files: string;
  variants_json: string;
}

// ImageKit types
export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
  thumbnailUrl?: string;
}

export interface ImageKitConfig {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
}

// ZIP extraction types
export interface ZipFileEntry {
  filename: string;
  buffer: Buffer;
  size: number;
  mimeType: string;
}

export interface ZipValidationResult {
  isValid: boolean;
  files: Map<string, ZipFileEntry>;
  errors: string[];
  totalSize: number;
}

// Constants
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
export const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_SKU_LENGTH = 64;
export const SESSION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
export const PREVIEW_ROWS_COUNT = 20;
