/**
 * ZIP Extraction Utility for Bulk Product Import
 * Uses JSZip library for handling ZIP files
 */

import JSZip from 'jszip';
import {
  ZipFileEntry,
  ZipValidationResult,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_ZIP_SIZE,
  MAX_IMAGE_SIZE,
} from './types';

/**
 * Extract and validate a ZIP file
 */
export async function extractZip(buffer: Buffer): Promise<ZipValidationResult> {
  const errors: string[] = [];
  const files = new Map<string, ZipFileEntry>();
  let totalSize = 0;
  
  // Check total ZIP size
  if (buffer.length > MAX_ZIP_SIZE) {
    return {
      isValid: false,
      files,
      errors: [`ZIP file exceeds maximum size of ${MAX_ZIP_SIZE / 1024 / 1024}MB`],
      totalSize: buffer.length
    };
  }
  
  try {
    const zip = await JSZip.loadAsync(buffer);
    
    // Process each file
    const fileEntries = Object.entries(zip.files);
    
    for (const [path, zipEntry] of fileEntries) {
      // Skip directories
      if (zipEntry.dir) continue;
      
      // Get filename (handle nested paths)
      const filename = path.split('/').pop() || path;
      const filenameLower = filename.toLowerCase();
      
      // Skip hidden files and macOS metadata
      if (filename.startsWith('.') || path.includes('__MACOSX')) continue;
      
      // Check if it's an image
      const ext = filenameLower.substring(filenameLower.lastIndexOf('.'));
      if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
        // Skip non-image files silently
        continue;
      }
      
      // Extract file content
      const fileBuffer = await zipEntry.async('nodebuffer');
      const fileSize = fileBuffer.length;
      totalSize += fileSize;
      
      // Check individual file size
      if (fileSize > MAX_IMAGE_SIZE) {
        errors.push(`File ${filename} exceeds maximum image size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
        continue;
      }
      
      // Determine MIME type
      const mimeType = getMimeType(ext);
      if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        errors.push(`Invalid image type for ${filename}`);
        continue;
      }
      
      // Store file entry (use lowercase key for case-insensitive lookup)
      files.set(filenameLower, {
        filename,
        buffer: fileBuffer,
        size: fileSize,
        mimeType
      });
    }
    
    if (files.size === 0) {
      errors.push('No valid image files found in ZIP');
    }
    
    return {
      isValid: errors.length === 0,
      files,
      errors,
      totalSize
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract ZIP file';
    return {
      isValid: false,
      files,
      errors: [message],
      totalSize: 0
    };
  }
}

/**
 * Get file listing from ZIP without full extraction
 */
export async function getZipFileList(buffer: Buffer): Promise<{
  files: Map<string, { filename: string; size: number }>;
  errors: string[];
}> {
  const files = new Map<string, { filename: string; size: number }>();
  const errors: string[] = [];
  
  // Check total ZIP size
  if (buffer.length > MAX_ZIP_SIZE) {
    return {
      files,
      errors: [`ZIP file exceeds maximum size of ${MAX_ZIP_SIZE / 1024 / 1024}MB`]
    };
  }
  
  try {
    const zip = await JSZip.loadAsync(buffer);
    
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      
      const filename = path.split('/').pop() || path;
      const filenameLower = filename.toLowerCase();
      
      // Skip hidden files and macOS metadata
      if (filename.startsWith('.') || path.includes('__MACOSX')) continue;
      
      // Check if it's an image
      const ext = filenameLower.substring(filenameLower.lastIndexOf('.'));
      if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) continue;
      
      // Get file info without extracting content
      // Note: JSZip doesn't expose uncompressed size directly, so we use 0 as placeholder
      // The actual size will be checked when extracting
      const size = 0;
      
      files.set(filenameLower, { filename, size });
    }
    
    return { files, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read ZIP file';
    return { files, errors: [message] };
  }
}

/**
 * Extract specific files from ZIP
 */
export async function extractFiles(
  buffer: Buffer,
  filenames: string[]
): Promise<Map<string, ZipFileEntry>> {
  const result = new Map<string, ZipFileEntry>();
  const zip = await JSZip.loadAsync(buffer);
  
  // Build lookup of requested files (case-insensitive)
  const requestedSet = new Set(filenames.map(f => f.toLowerCase()));
  
  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    
    const filename = path.split('/').pop() || path;
    const filenameLower = filename.toLowerCase();
    
    if (!requestedSet.has(filenameLower)) continue;
    
    const fileBuffer = await zipEntry.async('nodebuffer');
    const ext = filenameLower.substring(filenameLower.lastIndexOf('.'));
    const mimeType = getMimeType(ext);
    
    result.set(filenameLower, {
      filename,
      buffer: fileBuffer,
      size: fileBuffer.length,
      mimeType
    });
  }
  
  return result;
}

/**
 * Get MIME type from extension
 */
function getMimeType(ext: string): string {
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  
  return mimeMap[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Calculate hash for a buffer (for caching)
 */
export function hashBuffer(buffer: Buffer): string {
  // Simple hash for deduplication
  let hash = 0;
  const step = Math.max(1, Math.floor(buffer.length / 1000));
  
  for (let i = 0; i < buffer.length; i += step) {
    hash = ((hash << 5) - hash) + buffer[i];
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `hash_${Math.abs(hash).toString(16)}_${buffer.length}`;
}
