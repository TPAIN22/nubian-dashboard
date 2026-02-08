/**
 * Image Compression Utility for Web (Next.js / Browser)
 *
 * Compresses images before upload to reduce file size while maintaining quality.
 * Uses the Canvas API for client-side compression - no external dependencies.
 *
 * Features:
 * - Converts images to WebP format (optimal compression)
 * - Resizes large images (max width: 1920px)
 * - Preserves aspect ratio
 * - Skips compression for small files (<500KB)
 * - Handles multiple images
 * - Graceful error handling
 * - Works with File and Blob objects (for <input type="file">)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Compression settings - easily adjustable
 */
export const COMPRESSION_CONFIG = {
  /** Maximum width in pixels. Images wider than this will be resized. */
  MAX_WIDTH: 1920,

  /** Output format - WebP provides excellent compression with good quality */
  OUTPUT_FORMAT: "image/webp" as const,

  /** Quality setting (0-1). 0.75 is a good balance of size and quality */
  QUALITY: 0.75,

  /** Files smaller than this (in bytes) will skip compression */
  MIN_SIZE_FOR_COMPRESSION: 500 * 1024, // 500KB

  /** Supported input formats (MIME types) */
  SUPPORTED_FORMATS: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ],
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface CompressionResult {
  /** Compressed File object ready for upload */
  file: File;

  /** Original filename (with .webp extension if compressed) */
  fileName: string;

  /** Width of the compressed image */
  width: number;

  /** Height of the compressed image */
  height: number;

  /** Whether the image was actually compressed or skipped */
  wasCompressed: boolean;

  /** Original file size in bytes */
  originalSize: number;

  /** New file size in bytes */
  newSize: number;

  /** Compression ratio (e.g., 0.6 means 60% of original size) */
  compressionRatio: number;
}

export interface CompressionOptions {
  /** Maximum width (default: 1920) */
  maxWidth?: number;

  /** Quality 0-1 (default: 0.75) */
  quality?: number;

  /** Minimum file size in bytes to trigger compression (default: 500KB) */
  minSizeForCompression?: number;

  /** Force compression even for small files */
  forceCompress?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if the file format is supported for compression
 */
function isSupportedFormat(file: File): boolean {
  return COMPRESSION_CONFIG.SUPPORTED_FORMATS.includes(file.type as any);
}

/**
 * Create an image element from a File/Blob
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url); // Clean up
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Convert canvas to File object
 */
function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType: string,
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to convert canvas to blob"));
          return;
        }
        // Create File with new name (change extension to .webp)
        const newFileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
        const file = new File([blob], newFileName, { type: mimeType });
        resolve(file);
      },
      mimeType,
      quality
    );
  });
}

// ============================================================================
// MAIN COMPRESSION FUNCTION
// ============================================================================

/**
 * Compress a single image file
 *
 * @param file - File object from <input type="file">
 * @param options - Optional compression settings
 * @returns Promise<CompressionResult> - Compressed file info
 *
 * @example
 * ```ts
 * const input = document.querySelector('input[type="file"]');
 * const file = input.files[0];
 * const result = await compressImage(file);
 * console.log(`Compressed: ${result.wasCompressed}, Size: ${result.newSize}`);
 * // Use result.file for upload
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = COMPRESSION_CONFIG.MAX_WIDTH,
    quality = COMPRESSION_CONFIG.QUALITY,
    minSizeForCompression = COMPRESSION_CONFIG.MIN_SIZE_FOR_COMPRESSION,
    forceCompress = false,
  } = options;

  const originalSize = file.size;

  // Check file format
  if (!isSupportedFormat(file)) {
    console.warn(
      `compressImage: Unsupported format "${file.type}", returning original`
    );
    return {
      file,
      fileName: file.name,
      width: 0,
      height: 0,
      wasCompressed: false,
      originalSize,
      newSize: originalSize,
      compressionRatio: 1,
    };
  }

  // Skip compression for small files (unless forced)
  if (!forceCompress && originalSize < minSizeForCompression) {
    console.log(
      `compressImage: Skipping (${(originalSize / 1024).toFixed(1)}KB < ${(minSizeForCompression / 1024).toFixed(0)}KB threshold)`
    );
    return {
      file,
      fileName: file.name,
      width: 0,
      height: 0,
      wasCompressed: false,
      originalSize,
      newSize: originalSize,
      compressionRatio: 1,
    };
  }

  try {
    // Step 1: Load image to get dimensions
    const img = await loadImage(file);
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;

    // Step 2: Calculate new dimensions if resize needed
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth) {
      const ratio = maxWidth / originalWidth;
      newWidth = maxWidth;
      newHeight = Math.round(originalHeight * ratio);
    }

    // Step 3: Create canvas and draw resized image
    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw the image
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Step 4: Convert to WebP file
    const compressedFile = await canvasToFile(
      canvas,
      file.name,
      COMPRESSION_CONFIG.OUTPUT_FORMAT,
      quality
    );

    const newSize = compressedFile.size;
    const compressionRatio = newSize / originalSize;

    console.log(
      `compressImage: Success ` +
        `${originalWidth}x${originalHeight} → ${newWidth}x${newHeight}, ` +
        `${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB ` +
        `(${(compressionRatio * 100).toFixed(0)}%)`
    );

    return {
      file: compressedFile,
      fileName: compressedFile.name,
      width: newWidth,
      height: newHeight,
      wasCompressed: true,
      originalSize,
      newSize,
      compressionRatio,
    };
  } catch (error: any) {
    // Graceful error handling - return original on failure
    console.error(
      "compressImage: Compression failed, returning original:",
      error?.message
    );
    return {
      file,
      fileName: file.name,
      width: 0,
      height: 0,
      wasCompressed: false,
      originalSize,
      newSize: originalSize,
      compressionRatio: 1,
    };
  }
}

// ============================================================================
// BATCH COMPRESSION
// ============================================================================

/**
 * Compress multiple image files in parallel
 *
 * @param files - Array of File objects
 * @param options - Optional compression settings
 * @returns Promise<CompressionResult[]> - Array of compression results
 *
 * @example
 * ```ts
 * const input = document.querySelector('input[type="file"]');
 * const files = Array.from(input.files);
 * const results = await compressImages(files);
 * const compressedFiles = results.map(r => r.file);
 * ```
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  if (!files.length) {
    return [];
  }

  // Process in parallel for better performance
  const results = await Promise.all(
    files.map((file) => compressImage(file, options))
  );

  // Log summary
  const compressed = results.filter((r) => r.wasCompressed);
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalNew = results.reduce((sum, r) => sum + r.newSize, 0);

  console.log(
    `compressImages: ${compressed.length}/${results.length} images compressed, ` +
      `total: ${(totalOriginal / 1024).toFixed(1)}KB → ${(totalNew / 1024).toFixed(1)}KB`
  );

  return results;
}

// ============================================================================
// CONVENIENCE FUNCTION FOR UPLOAD INTEGRATION
// ============================================================================

/**
 * Compress an image and return just the File for uploading
 * This is a convenience wrapper for direct integration with upload flows.
 *
 * @param file - File object from file input
 * @returns Promise<File> - Compressed File (or original if skipped/failed)
 *
 * @example
 * ```ts
 * // In your file change handler:
 * const compressedFile = await prepareImageForUpload(selectedFile);
 * await uploadImageToImageKit(compressedFile);
 * ```
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const result = await compressImage(file);
  return result.file;
}
