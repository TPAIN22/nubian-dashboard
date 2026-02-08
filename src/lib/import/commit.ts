/**
 * MongoDB Commit Logic for Bulk Product Import
 * Uses bulkWrite with upsert operations
 * 
 * Aligned with backend: nubian-auth/src/models/product.model.js
 */

import mongoose from 'mongoose';
import { connect } from '../connect';
import {
  ImportRowValidated,
  CommitResult,
  FailedRow,
  ImageKitUploadResult,
  ZipFileEntry,
} from './types';
import { uploadRowImages } from './imagekit';
import { extractFiles } from './zip';
import logger from '../logger';

// Attribute definition schema (matches backend)
const attributeDefSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    type: { type: String, enum: ['select', 'text', 'number'], default: 'select' },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
  },
  { _id: true }
);

// Variant schema (matches backend)
const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    attributes: { type: Map, of: String, required: true },
    
    // Pricing fields
    merchantPrice: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 }, // legacy mirror
    
    // Smart pricing fields
    nubianMarkup: { type: Number, default: 10, min: 0 },
    dynamicMarkup: { type: Number, default: 0, min: -50 },
    finalPrice: { type: Number, default: 0, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    
    stock: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

// Product schema (matches backend nubian-auth/src/models/product.model.js)
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    // Product-level pricing for simple products
    merchantPrice: { type: Number, min: 0 },
    price: { type: Number, min: 0 },

    // Smart pricing fields
    nubianMarkup: { type: Number, default: 10, min: 0 },
    dynamicMarkup: { type: Number, default: 0, min: -50 },
    finalPrice: { type: Number, default: 0, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },

    // Stock for simple products
    stock: { type: Number, min: 0 },

    // Legacy fields
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },

    // New attributes definitions
    attributes: { type: [attributeDefSchema], default: [] },

    // Variants
    variants: { type: [variantSchema], default: [] },

    isActive: { type: Boolean, default: true },

    // Admin ranking controls
    priorityScore: { type: Number, default: 0, min: 0, max: 100 },
    featured: { type: Boolean, default: false },

    // Tracking + ranking
    trackingFields: {
      views24h: { type: Number, default: 0, min: 0 },
      cartCount24h: { type: Number, default: 0, min: 0 },
      sales24h: { type: Number, default: 0, min: 0 },
      favoritesCount: { type: Number, default: 0, min: 0 },
    },

    rankingFields: {
      visibilityScore: { type: Number, default: 0, min: 0 },
      conversionRate: { type: Number, default: 0, min: 0, max: 100 },
      storeRating: { type: Number, default: 0, min: 0, max: 5 },
      priorityScore: { type: Number, default: 0, min: 0 },
      featured: { type: Boolean, default: false },
    },

    visibilityScore: { type: Number, default: 0, min: 0, index: true },
    scoreCalculatedAt: { type: Date, default: null },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

    images: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one image is required',
      },
    },

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },

    merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', default: null },

    deletedAt: { type: Date, default: null, index: true },
    
    // Import tracking - SKU field for import upsert matching
    // Note: This is used for import matching, not in original backend schema
    // The backend uses name + merchant for uniqueness, but we add SKU for import
    importSku: { type: String, trim: true, index: true },
  },
  { timestamps: true }
);

// Compound index for import upsert (merchant + importSku)
productSchema.index({ merchant: 1, importSku: 1 }, { unique: true, sparse: true });

// Standard indexes from backend
productSchema.index({ category: 1, isActive: 1, deletedAt: 1 });
productSchema.index({ merchant: 1, deletedAt: 1, createdAt: -1 });
productSchema.index({ isActive: 1, deletedAt: 1, featured: -1, priorityScore: -1, createdAt: -1 });
productSchema.index({ visibilityScore: -1 });

// Get or create Product model
function getProductModel() {
  // Clear existing model to ensure schema is up to date
  if (mongoose.models.Product) {
    return mongoose.models.Product;
  }
  return mongoose.model('Product', productSchema);
}

interface CommitOptions {
  merchantId: string;
  rows: ImportRowValidated[];
  mode: 'url' | 'zip';
  zipBuffer?: Buffer;
  categoryMap?: Map<string, string>; // category name -> ObjectId
  defaultCategoryId?: string; // fallback category if none specified
}

/**
 * Calculate final price using smart pricing (matches backend pre-save middleware)
 */
function calculateFinalPrice(merchantPrice: number, nubianMarkup = 10, dynamicMarkup = 0, discountPrice = 0): number {
  // If there's a manual discountPrice override, it takes absolute priority
  if (discountPrice && discountPrice > 0) {
    return discountPrice;
  }

  if (merchantPrice <= 0) return 0;

  // final = merchant + (merchant * markup%) + (merchant * dynamic%)
  const markupAmount = (merchantPrice * nubianMarkup) / 100;
  const dynamicAmount = (merchantPrice * dynamicMarkup) / 100;

  return Math.max(0, merchantPrice + markupAmount + dynamicAmount);
}

/**
 * Commit validated rows to MongoDB
 */
export async function commitImport(options: CommitOptions): Promise<CommitResult> {
  const { merchantId, rows, mode, zipBuffer, categoryMap, defaultCategoryId } = options;
  
  // Connect to MongoDB
  await connect();
  const Product = getProductModel();
  
  const failures: FailedRow[] = [];
  const bulkOps: any[] = [];
  const uploadCache = new Map<string, ImageKitUploadResult>();
  
  let uploadedImages = 0;
  let skippedCount = 0;
  
  // Extract ZIP files if needed
  let zipFiles: Map<string, ZipFileEntry> | undefined;
  if (mode === 'zip' && zipBuffer) {
    // Collect all needed filenames
    const neededFiles = new Set<string>();
    for (const row of rows) {
      if (row.isValid && row.imageFiles) {
        row.imageFiles.forEach(f => neededFiles.add(f.toLowerCase()));
      }
    }
    
    if (neededFiles.size > 0) {
      zipFiles = await extractFiles(zipBuffer, Array.from(neededFiles));
      logger.info('Extracted files from ZIP for commit', { count: zipFiles.size });
    }
  }
  
  // Process each row
  for (const row of rows) {
    // Skip invalid rows
    if (!row.isValid) {
      failures.push({
        rowIndex: row.rowIndex,
        sku: row.sku,
        name: row.name,
        reason: 'Validation failed',
        errors: row.errors
      });
      skippedCount++;
      continue;
    }
    
    try {
      // Resolve images
      let images: string[] = [];
      
      if (mode === 'zip' && row.imageFiles && row.imageFiles.length > 0 && zipFiles) {
        // Upload images from ZIP
        const { urls, errors } = await uploadRowImages(
          row.imageFiles,
          zipFiles,
          merchantId,
          uploadCache
        );
        
        if (errors.length > 0) {
          failures.push({
            rowIndex: row.rowIndex,
            sku: row.sku,
            name: row.name,
            reason: 'Image upload failed',
            errors: errors.map(e => ({ field: 'images', message: e, code: 'FILE_NOT_FOUND' as const }))
          });
          skippedCount++;
          continue;
        }
        
        images = urls;
        uploadedImages += urls.length;
      } else if (mode === 'url') {
        // Use URLs directly (filter out any pending: prefixes)
        images = row.images.filter(url => !url.startsWith('pending:'));
      }
      
      // Validate images - at least one required
      if (images.length === 0) {
        failures.push({
          rowIndex: row.rowIndex,
          sku: row.sku,
          name: row.name,
          reason: 'At least one image is required',
          errors: [{ field: 'images', message: 'At least one image is required', code: 'REQUIRED_FIELD' }]
        });
        skippedCount++;
        continue;
      }
      
      // Resolve category to ObjectId - required field
      let categoryId: mongoose.Types.ObjectId | undefined;
      if (row.category && categoryMap) {
        const catId = categoryMap.get(row.category.toLowerCase());
        if (catId) {
          categoryId = new mongoose.Types.ObjectId(catId);
        }
      }
      
      // Use default category if not resolved
      if (!categoryId && defaultCategoryId) {
        categoryId = new mongoose.Types.ObjectId(defaultCategoryId);
      }
      
      // Category is required
      if (!categoryId) {
        failures.push({
          rowIndex: row.rowIndex,
          sku: row.sku,
          name: row.name,
          reason: 'Category is required and could not be resolved',
          errors: [{ field: 'category', message: 'Category is required', code: 'REQUIRED_FIELD' }]
        });
        skippedCount++;
        continue;
      }
      
      // Calculate final price
      const finalPrice = calculateFinalPrice(row.price, 10, 0, 0);
      
      // Prepare update document aligned with backend schema
      const updateDoc: Record<string, unknown> = {
        name: row.name,
        description: row.description || 'No description provided', // Required field
        merchantPrice: row.price,
        price: row.price, // Legacy mirror
        stock: row.stock,
        images,
        category: categoryId,
        isActive: true,
        nubianMarkup: 10, // Default markup
        dynamicMarkup: 0,
        finalPrice,
        discountPrice: 0,
        deletedAt: null,
      };
      
      // Handle variants if present
      if (row.variants && row.variants.length > 0) {
        const processedVariants = row.variants.map(v => {
          const variantFinalPrice = calculateFinalPrice(v.merchantPrice, 10, 0, 0);
          return {
            sku: v.sku,
            attributes: v.attributes,
            merchantPrice: v.merchantPrice,
            price: v.merchantPrice, // Legacy mirror
            nubianMarkup: 10,
            dynamicMarkup: 0,
            finalPrice: variantFinalPrice,
            discountPrice: 0,
            stock: v.stock,
            images: v.images || [],
            isActive: v.isActive !== false
          };
        });
        
        updateDoc.variants = processedVariants;
        updateDoc.attributes = []; // Would need to extract from variants
        
        // For variant products, set product-level finalPrice as minimum variant price
        const minVariantPrice = Math.min(...processedVariants.map(v => v.finalPrice));
        updateDoc.finalPrice = minVariantPrice > 0 ? minVariantPrice : finalPrice;
        
        // Clear product-level stock/price for variant products (optional)
        // Backend schema makes these conditional based on variants presence
      }
      
      // Create bulkWrite operation using importSku for upsert matching
      bulkOps.push({
        updateOne: {
          filter: {
            merchant: new mongoose.Types.ObjectId(merchantId),
            importSku: row.sku
          },
          update: {
            $set: updateDoc,
            $setOnInsert: {
              importSku: row.sku,
              merchant: new mongoose.Types.ObjectId(merchantId),
              createdAt: new Date(),
              priorityScore: 0,
              featured: false,
              sizes: [],
              colors: [],
              reviews: [],
              averageRating: 0,
              visibilityScore: 0,
              scoreCalculatedAt: null,
              trackingFields: {
                views24h: 0,
                cartCount24h: 0,
                sales24h: 0,
                favoritesCount: 0,
              },
              rankingFields: {
                visibilityScore: 0,
                conversionRate: 0,
                storeRating: 0,
                priorityScore: 0,
                featured: false,
              },
            }
          },
          upsert: true
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failures.push({
        rowIndex: row.rowIndex,
        sku: row.sku,
        name: row.name,
        reason: errorMessage,
        errors: [{ field: 'general', message: errorMessage, code: 'INVALID_FORMAT' }]
      });
      skippedCount++;
    }
  }
  
  // Execute bulkWrite
  let insertedCount = 0;
  let updatedCount = 0;
  
  if (bulkOps.length > 0) {
    try {
      // Use collection.bulkWrite directly to avoid Mongoose type conflicts
      const result = await Product.collection.bulkWrite(bulkOps, { ordered: false });
      
      insertedCount = result.upsertedCount || 0;
      updatedCount = result.modifiedCount || 0;
      
      logger.info('BulkWrite completed', {
        merchantId,
        insertedCount,
        updatedCount,
        totalOps: bulkOps.length
      });
    } catch (error: unknown) {
      // Handle partial failures
      const bulkError = error as { writeErrors?: Array<{ index: number; errmsg?: string }>; result?: { upsertedCount?: number; modifiedCount?: number } };
      
      if (bulkError.writeErrors) {
        const writeErrors = bulkError.writeErrors;
        
        for (const writeError of writeErrors) {
          const opIndex = writeError.index;
          // Find the corresponding row (account for skipped rows)
          const validRows = rows.filter(r => r.isValid);
          const row = validRows[opIndex];
          
          if (row) {
            failures.push({
              rowIndex: row.rowIndex,
              sku: row.sku,
              name: row.name,
              reason: writeError.errmsg || 'Database write error',
              errors: [{ field: 'database', message: writeError.errmsg || 'Write error', code: 'INVALID_FORMAT' }]
            });
          }
        }
        
        // Get successful counts from partial result
        insertedCount = bulkError.result?.upsertedCount || 0;
        updatedCount = bulkError.result?.modifiedCount || 0;
        
        logger.warn('BulkWrite completed with errors', {
          merchantId,
          insertedCount,
          updatedCount,
          errorCount: writeErrors.length
        });
      } else {
        throw error;
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
    uploadedImages
  };
}

/**
 * Ensure the compound index exists
 */
export async function ensureIndexes(): Promise<void> {
  await connect();
  const Product = getProductModel();
  
  try {
    await Product.collection.createIndex(
      { merchant: 1, importSku: 1 },
      { unique: true, sparse: true, background: true }
    );
    logger.info('Ensured compound index on (merchant, importSku)');
  } catch (error) {
    // Index might already exist
    logger.debug('Index creation result', { error });
  }
}

/**
 * Get category map for resolving category names to ObjectIds
 */
export async function getCategoryMap(): Promise<Map<string, string>> {
  await connect();
  
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({
    name: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
  }));
  
  const categories = await Category.find({}).select('_id name').lean();
  
  const map = new Map<string, string>();
  for (const cat of categories) {
    if (cat.name) {
      map.set(String(cat.name).toLowerCase(), String(cat._id));
    }
  }
  
  return map;
}

/**
 * Get a default category ID (first available category)
 */
export async function getDefaultCategoryId(): Promise<string | undefined> {
  await connect();
  
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({
    name: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
  }));
  
  const category = await Category.findOne({}).select('_id').lean() as { _id: unknown } | null;
  
  return category ? String(category._id) : undefined;
}
