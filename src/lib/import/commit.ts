/**
 * Bulk product import — commit step.
 *
 * Architecture:
 *   - The dashboard owns the file-handling concerns: ZIP extraction and
 *     image upload to ImageKit (which needs the user's session + a server-side
 *     API key the backend doesn't have).
 *   - The unified backend (`nubian-auth`) owns all DB writes via
 *     `POST /api/products/admin/bulk-import`. The Mongoose schema lives there,
 *     not here. Schema drift is impossible because we never define it twice.
 */

import {
  ImportRowValidated,
  CommitResult,
  FailedRow,
  ImageKitUploadResult,
  ZipFileEntry,
} from './types';
import { uploadRowImages } from './imagekit';
import { extractFiles } from './zip';
import { auth } from '@clerk/nextjs/server';
import axios from 'axios';
import logger from '../logger';

const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.AUTH_API_URL || '';
  if (!raw) return '';
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
})();

interface CommitOptions {
  merchantId: string;
  rows: ImportRowValidated[];
  mode: 'url' | 'zip';
  zipBuffer?: Buffer;
  /** category name (lowercase) → ObjectId */
  categoryMap?: Map<string, string>;
  /** fallback category ObjectId */
  defaultCategoryId?: string;
}

/**
 * Backend bulk-import row payload.
 * MUST stay in sync with `bulkImportProducts` in nubian-auth/src/controllers/products.controller.js.
 */
interface BackendRow {
  importSku: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  variants: Array<{
    sku: string;
    attributes: Record<string, string>;
    merchantPrice: number;
    stock: number;
    images: string[];
    isActive: boolean;
  }>;
}

/**
 * Build a single backend-ready row (or null if the row should be skipped/failed).
 * Returns the row or pushes to `failures` and returns null.
 */
function buildBackendRow(
  row: ImportRowValidated,
  categoryId: string,
  resolvedImages: string[],
): BackendRow {
  // Variants are required by the backend Product schema. If the import row
  // has no explicit variants, synthesize a single default variant from the
  // row's flat fields so the backend accepts it.
  const variants =
    row.variants && row.variants.length > 0
      ? row.variants.map((v) => ({
          sku: v.sku,
          attributes: v.attributes,
          merchantPrice: Number(v.merchantPrice),
          stock: Number(v.stock),
          images: v.images ?? [],
          isActive: v.isActive !== false,
        }))
      : [
          {
            sku: row.sku,
            attributes: { default: 'default' },
            merchantPrice: Number(row.price),
            stock: Number(row.stock),
            images: resolvedImages,
            isActive: true,
          },
        ];

  return {
    importSku: row.sku,
    name: row.name,
    description: row.description || row.name,
    category: categoryId,
    images: resolvedImages,
    variants,
  };
}

/**
 * Commit validated rows by uploading images and forwarding to the backend.
 */
export async function commitImport(options: CommitOptions): Promise<CommitResult> {
  const { merchantId, rows, mode, zipBuffer, categoryMap, defaultCategoryId } = options;

  if (!API_BASE) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set — cannot reach the unified backend for bulk import.',
    );
  }

  const failures: FailedRow[] = [];
  const backendRows: BackendRow[] = [];
  const rowIndexByPosition: number[] = []; // backendRows[i] ↔ rows[rowIndexByPosition[i]]
  const uploadCache = new Map<string, ImageKitUploadResult>();

  let uploadedImages = 0;
  let skippedCount = 0;

  // Extract only the ZIP entries we actually need (lazy)
  let zipFiles: Map<string, ZipFileEntry> | undefined;
  if (mode === 'zip' && zipBuffer) {
    const needed = new Set<string>();
    for (const r of rows) {
      if (r.isValid && r.imageFiles) r.imageFiles.forEach((f) => needed.add(f.toLowerCase()));
    }
    if (needed.size > 0) {
      zipFiles = await extractFiles(zipBuffer, Array.from(needed));
      logger.info('Extracted ZIP files for bulk import', { count: zipFiles.size });
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.isValid) {
      failures.push({
        rowIndex: row.rowIndex,
        sku: row.sku,
        name: row.name,
        reason: 'Validation failed',
        errors: row.errors,
      });
      skippedCount++;
      continue;
    }

    try {
      // 1) Resolve images
      let images: string[] = [];
      if (mode === 'zip' && row.imageFiles?.length && zipFiles) {
        const { urls, errors } = await uploadRowImages(
          row.imageFiles,
          zipFiles,
          merchantId,
          uploadCache,
        );
        if (errors.length) {
          failures.push({
            rowIndex: row.rowIndex,
            sku: row.sku,
            name: row.name,
            reason: 'Image upload failed',
            errors: errors.map((e) => ({
              field: 'images',
              message: e,
              code: 'FILE_NOT_FOUND' as const,
            })),
          });
          skippedCount++;
          continue;
        }
        images = urls;
        uploadedImages += urls.length;
      } else if (mode === 'url') {
        images = row.images.filter((u) => !u.startsWith('pending:'));
      }

      if (images.length === 0) {
        failures.push({
          rowIndex: row.rowIndex,
          sku: row.sku,
          name: row.name,
          reason: 'At least one image is required',
          errors: [
            { field: 'images', message: 'At least one image is required', code: 'REQUIRED_FIELD' },
          ],
        });
        skippedCount++;
        continue;
      }

      // 2) Resolve category
      let categoryId: string | undefined;
      if (row.category && categoryMap) {
        categoryId = categoryMap.get(row.category.toLowerCase());
      }
      if (!categoryId && defaultCategoryId) {
        categoryId = defaultCategoryId;
      }
      if (!categoryId) {
        failures.push({
          rowIndex: row.rowIndex,
          sku: row.sku,
          name: row.name,
          reason: 'Category is required and could not be resolved',
          errors: [{ field: 'category', message: 'Category is required', code: 'REQUIRED_FIELD' }],
        });
        skippedCount++;
        continue;
      }

      // 3) Build backend payload
      backendRows.push(buildBackendRow(row, categoryId, images));
      rowIndexByPosition.push(i);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      failures.push({
        rowIndex: row.rowIndex,
        sku: row.sku,
        name: row.name,
        reason: message,
        errors: [{ field: 'general', message, code: 'INVALID_FORMAT' }],
      });
      skippedCount++;
    }
  }

  // 4) Forward to backend in one call
  let insertedCount = 0;
  let updatedCount = 0;

  if (backendRows.length > 0) {
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
      throw new Error('Unauthorized: missing Clerk session for bulk-import call.');
    }

    try {
      const response = await axios.post(
        `${API_BASE}/products/admin/bulk-import`,
        { merchantId, rows: backendRows },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 120_000, // bulk imports can be large
          validateStatus: () => true,
        },
      );

      if (response.status >= 400) {
        // Whole-batch failure — surface a single error against every row we tried
        const message =
          response.data?.error?.message || response.data?.message || `Backend returned ${response.status}`;
        for (const idx of rowIndexByPosition) {
          const r = rows[idx];
          failures.push({
            rowIndex: r.rowIndex,
            sku: r.sku,
            name: r.name,
            reason: message,
            errors: [{ field: 'database', message, code: 'INVALID_FORMAT' }],
          });
        }
      } else {
        const data = response.data?.data ?? {};
        insertedCount = data.insertedCount ?? 0;
        updatedCount = data.updatedCount ?? 0;
        // Map backend per-row failures back to our rowIndex space
        const beFailures: Array<{ index: number; importSku: string | null; reason: string }> =
          data.failures ?? [];
        for (const f of beFailures) {
          const sourceRow = f.index >= 0 && f.index < rowIndexByPosition.length
            ? rows[rowIndexByPosition[f.index]]
            : undefined;
          failures.push({
            rowIndex: sourceRow?.rowIndex ?? -1,
            sku: sourceRow?.sku ?? f.importSku ?? '',
            name: sourceRow?.name ?? '',
            reason: f.reason,
            errors: [{ field: 'database', message: f.reason, code: 'INVALID_FORMAT' }],
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Backend unreachable';
      logger.error('Bulk-import backend call failed', { error: message });
      for (const idx of rowIndexByPosition) {
        const r = rows[idx];
        failures.push({
          rowIndex: r.rowIndex,
          sku: r.sku,
          name: r.name,
          reason: message,
          errors: [{ field: 'database', message, code: 'INVALID_FORMAT' }],
        });
      }
    }
  }

  return {
    success: failures.length === 0,
    totalRows: rows.length,
    insertedCount,
    updatedCount,
    skippedCount,
    failedCount: failures.length,
    failures,
    uploadedImages,
  };
}

/**
 * Index management is now the backend's responsibility (see product.model.js).
 * Kept as a no-op so callers don't have to change.
 */
export async function ensureIndexes(): Promise<void> {
  // No-op — the backend owns the schema and its indexes.
}

/**
 * Fetch the category-name → ObjectId map from the backend.
 *
 * Replaces the previous direct-Mongo lookup. Cached per server process via
 * the closure module; if you need fresh data, restart the server.
 */
export async function getCategoryMap(): Promise<Map<string, string>> {
  if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_API_URL is not set — cannot fetch categories.');
  }

  const { getToken } = await auth();
  const token = await getToken();
  if (!token) throw new Error('Unauthorized: missing Clerk session for category fetch.');

  const response = await axios.get(`${API_BASE}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30_000,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new Error(
      `Failed to fetch categories from backend (status ${response.status}): ${
        response.data?.error?.message ?? response.data?.message ?? 'unknown error'
      }`,
    );
  }

  const data = response.data?.data ?? response.data ?? [];
  const list: Array<{ _id: string; name: string }> = Array.isArray(data) ? data : [];

  const map = new Map<string, string>();
  for (const cat of list) {
    if (cat?.name && cat?._id) {
      map.set(String(cat.name).toLowerCase(), String(cat._id));
    }
  }
  return map;
}

/**
 * Fallback category for rows that don't resolve a name.
 * Returns the first category from the backend list.
 */
export async function getDefaultCategoryId(): Promise<string | undefined> {
  const map = await getCategoryMap();
  const first = map.values().next();
  return first.done ? undefined : first.value;
}
