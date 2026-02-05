/**
 * ImageKit Upload Utility for Bulk Product Import
 * Server-side only - uses ImageKit SDK
 */

import ImageKit from 'imagekit';
import { ImageKitUploadResult, ZipFileEntry } from './types';
import logger from '../logger';

// Singleton ImageKit instance
let imageKitInstance: ImageKit | null = null;

/**
 * Get or create ImageKit instance
 */
function getImageKit(): ImageKit {
  if (imageKitInstance) {
    return imageKitInstance;
  }

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error(
      'ImageKit configuration missing. Required env vars: ' +
      'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY (or NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY), NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT'
    );
  }

  imageKitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint
  });

  return imageKitInstance;
}

/**
 * Upload a single image to ImageKit
 */
export async function uploadToImageKit(
  buffer: Buffer,
  filename: string,
  merchantId: string
): Promise<ImageKitUploadResult> {
  const imageKit = getImageKit();
  
  // Generate date-based folder path
  const now = new Date();
  const dateFolder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const folder = `products/${merchantId}/${dateFolder}`;
  
  // Clean filename - remove special chars, keep extension
  const cleanFilename = sanitizeFilename(filename);
  
  try {
    const response = await imageKit.upload({
      file: buffer,
      fileName: cleanFilename,
      folder,
      useUniqueFileName: true, // Prevent overwrites
      tags: [`merchant:${merchantId}`, 'import']
    });
    
    logger.info('ImageKit upload successful', {
      filename: cleanFilename,
      folder,
      fileId: response.fileId,
      url: response.url
    });
    
    return {
      url: response.url,
      fileId: response.fileId,
      name: response.name,
      thumbnailUrl: response.thumbnailUrl
    };
  } catch (error) {
    logger.error('ImageKit upload failed', {
      filename,
      merchantId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Upload multiple images with caching (deduplication)
 * Returns a map of original filename -> ImageKit URL
 */
export async function uploadBatchToImageKit(
  files: Map<string, ZipFileEntry>,
  merchantId: string,
  progressCallback?: (uploaded: number, total: number) => void
): Promise<Map<string, ImageKitUploadResult>> {
  const results = new Map<string, ImageKitUploadResult>();
  const uploadCache = new Map<string, ImageKitUploadResult>(); // Cache by content hash
  
  const total = files.size;
  let uploaded = 0;
  
  // Process files with concurrency limit
  const concurrencyLimit = 5;
  const entries = Array.from(files.entries());
  
  for (let i = 0; i < entries.length; i += concurrencyLimit) {
    const batch = entries.slice(i, i + concurrencyLimit);
    
    const promises = batch.map(async ([key, file]) => {
      // Generate simple hash for deduplication within session
      const contentKey = `${file.size}_${file.buffer.slice(0, 100).toString('hex')}`;
      
      // Check cache
      if (uploadCache.has(contentKey)) {
        const cached = uploadCache.get(contentKey)!;
        logger.debug('Using cached upload for duplicate image', {
          filename: file.filename,
          cachedUrl: cached.url
        });
        return { key, result: cached };
      }
      
      try {
        const result = await uploadToImageKit(file.buffer, file.filename, merchantId);
        uploadCache.set(contentKey, result);
        return { key, result };
      } catch (error) {
        logger.error('Failed to upload image', {
          filename: file.filename,
          error: error instanceof Error ? error.message : String(error)
        });
        throw new Error(`Failed to upload ${file.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    const batchResults = await Promise.all(promises);
    
    for (const { key, result } of batchResults) {
      results.set(key, result);
      uploaded++;
      progressCallback?.(uploaded, total);
    }
  }
  
  return results;
}

/**
 * Upload images for a single row
 */
export async function uploadRowImages(
  imageFiles: string[],
  zipFiles: Map<string, ZipFileEntry>,
  merchantId: string,
  uploadCache: Map<string, ImageKitUploadResult>
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];
  
  for (const filename of imageFiles) {
    const fileKey = filename.toLowerCase();
    
    // Check if already uploaded in this session
    if (uploadCache.has(fileKey)) {
      urls.push(uploadCache.get(fileKey)!.url);
      continue;
    }
    
    // Get file from ZIP
    const file = zipFiles.get(fileKey);
    if (!file) {
      errors.push(`File not found in ZIP: ${filename}`);
      continue;
    }
    
    try {
      const result = await uploadToImageKit(file.buffer, file.filename, merchantId);
      uploadCache.set(fileKey, result);
      urls.push(result.url);
    } catch (error) {
      errors.push(`Upload failed for ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { urls, errors };
}

/**
 * Sanitize filename for ImageKit
 */
function sanitizeFilename(filename: string): string {
  // Get extension
  const lastDot = filename.lastIndexOf('.');
  const ext = lastDot !== -1 ? filename.substring(lastDot) : '';
  const name = lastDot !== -1 ? filename.substring(0, lastDot) : filename;
  
  // Remove special characters, keep alphanumeric, dash, underscore
  const cleanName = name
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100); // Limit length
  
  return `${cleanName}${ext.toLowerCase()}`;
}

/**
 * Delete images from ImageKit (for cleanup on import failure)
 */
export async function deleteFromImageKit(fileIds: string[]): Promise<void> {
  if (fileIds.length === 0) return;
  
  const imageKit = getImageKit();
  
  try {
    await imageKit.bulkDeleteFiles(fileIds);
    logger.info('Deleted images from ImageKit', { count: fileIds.length });
  } catch (error) {
    logger.error('Failed to delete images from ImageKit', {
      fileIds,
      error: error instanceof Error ? error.message : String(error)
    });
    // Don't throw - this is a cleanup operation
  }
}
