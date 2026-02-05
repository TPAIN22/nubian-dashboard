/**
 * Normalizes product payload before sending to the database.
 * 
 * This handles the case where variant prices can be OPTIONAL in the UI,
 * but the DB schema REQUIRES variant.merchantPrice and variant.price.
 * 
 * Rules:
 * - For variant products:
 *   - Each variant must have merchantPrice and price (required by schema)
 *   - If a variant has no merchantPrice, use defaultVariantMerchantPrice as fallback
 *   - variant.price mirrors variant.merchantPrice (legacy field)
 *   - Product-level merchantPrice/price should be undefined (not required for variant products)
 * 
 * - For simple products:
 *   - product.price mirrors product.merchantPrice (legacy field)
 */

import { ProductVariantDTO, ProductAttributeDefDTO } from "@/domain/product/product.types";

// --------------------------------------------------------------------------
// Types for form payload (UI-specific fields that don't go to DB)
// --------------------------------------------------------------------------

export interface FormVariant {
  _id?: string;
  sku: string;
  attributes: Record<string, string>;
  merchantPrice?: number | "" | undefined;
  nubianMarkup?: number;
  price?: number;
  stock: number;
  images?: string[];
  isActive: boolean;
}

export interface ProductFormPayload {
  name: string;
  description: string;
  category: string;
  images: string[];
  isActive?: boolean;
  
  // Simple product fields
  merchantPrice?: number;
  nubianMarkup?: number;
  price?: number;
  stock?: number;
  
  // Variant product fields
  attributes?: ProductAttributeDefDTO[];
  variants?: FormVariant[];
  
  // UI-only fields for variant pricing
  defaultVariantMerchantPrice?: number | "";
  samePriceForAllVariants?: boolean;
  
  // Other fields
  merchant?: string;
  priorityScore?: number;
  featured?: boolean;
  sizes?: string[];
  colors?: string[];
}

export interface NormalizedProductPayload {
  name: string;
  description: string;
  category: string;
  images: string[];
  isActive: boolean;
  
  // For simple products
  merchantPrice?: number;
  nubianMarkup?: number;
  price?: number;
  stock?: number;
  
  // For variant products
  attributes?: ProductAttributeDefDTO[];
  variants?: ProductVariantDTO[];
  
  // Other fields
  merchant?: string;
  priorityScore?: number;
  featured?: boolean;
  sizes?: string[];
  colors?: string[];
}

// --------------------------------------------------------------------------
// Validation result type
// --------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// --------------------------------------------------------------------------
// Main normalization function
// --------------------------------------------------------------------------

/**
 * Normalizes product payload for database submission.
 * Ensures all required variant fields are populated.
 */
export function normalizeProductPayload(
  payload: ProductFormPayload,
  productType: "simple" | "with_variants"
): NormalizedProductPayload {
  const normalized: NormalizedProductPayload = {
    name: payload.name.trim(),
    description: payload.description.trim(),
    category: payload.category.trim(),
    images: payload.images,
    isActive: payload.isActive !== false,
  };
  
  // Copy optional fields if present
  if (payload.merchant) {
    normalized.merchant = payload.merchant;
  }
  if (payload.priorityScore !== undefined) {
    normalized.priorityScore = payload.priorityScore;
  }
  if (payload.featured !== undefined) {
    normalized.featured = payload.featured;
  }
  if (payload.sizes && payload.sizes.length > 0) {
    normalized.sizes = payload.sizes;
  }
  if (payload.colors && payload.colors.length > 0) {
    normalized.colors = payload.colors;
  }
  
  if (productType === "simple") {
    return normalizeSimpleProduct(normalized, payload);
  } else {
    return normalizeVariantProduct(normalized, payload);
  }
}

/**
 * Normalizes a simple product.
 * Sets price = merchantPrice (legacy mirror).
 */
function normalizeSimpleProduct(
  normalized: NormalizedProductPayload,
  payload: ProductFormPayload
): NormalizedProductPayload {
  const merchantPrice = typeof payload.merchantPrice === "number" 
    ? payload.merchantPrice 
    : (typeof payload.price === "number" ? payload.price : 0);
    
  normalized.merchantPrice = merchantPrice;
  normalized.price = merchantPrice; // Legacy mirror
  normalized.nubianMarkup = payload.nubianMarkup ?? 10;
  normalized.stock = payload.stock ?? 0;
  
  // Clear variant-related fields
  normalized.variants = undefined;
  normalized.attributes = undefined;
  
  return normalized;
}

/**
 * Normalizes a variant product.
 * Resolves variant prices using defaultVariantMerchantPrice as fallback.
 */
function normalizeVariantProduct(
  normalized: NormalizedProductPayload,
  payload: ProductFormPayload
): NormalizedProductPayload {
  const defaultPrice = parseNumberOrUndefined(payload.defaultVariantMerchantPrice);
  const defaultNubianMarkup = payload.nubianMarkup ?? 10;
  
  // Copy attributes
  normalized.attributes = payload.attributes || [];
  
  // Normalize variants
  normalized.variants = (payload.variants || []).map((variant): ProductVariantDTO => {
    // Resolve merchantPrice: use variant's price if set, otherwise use default
    const variantMerchantPrice = parseNumberOrUndefined(variant.merchantPrice);
    const resolvedMerchantPrice = variantMerchantPrice ?? defaultPrice ?? 0;
    
    // Ensure attributes is a proper object (not Map)
    const attributes = variant.attributes instanceof Map
      ? Object.fromEntries(variant.attributes)
      : variant.attributes || {};
    
    return {
      _id: variant._id,
      sku: variant.sku || "",
      attributes,
      merchantPrice: resolvedMerchantPrice,
      price: resolvedMerchantPrice, // Legacy mirror
      nubianMarkup: variant.nubianMarkup ?? defaultNubianMarkup,
      stock: variant.stock ?? 0,
      images: variant.images || [],
      isActive: variant.isActive !== false,
    };
  });
  
  // For variant products, clear product-level pricing (schema requirement)
  // The schema allows merchantPrice/price to be undefined when variants exist
  normalized.merchantPrice = undefined;
  normalized.price = undefined;
  normalized.stock = undefined;
  
  return normalized;
}

// --------------------------------------------------------------------------
// Validation functions
// --------------------------------------------------------------------------

/**
 * Validates product payload before normalization.
 * Returns validation errors if any.
 */
export function validateProductPayload(
  payload: ProductFormPayload,
  productType: "simple" | "with_variants"
): ValidationResult {
  const errors: string[] = [];
  
  // Common validations
  if (!payload.name?.trim()) {
    errors.push("اسم المنتج مطلوب");
  }
  if (!payload.description?.trim()) {
    errors.push("الوصف مطلوب");
  }
  if (!payload.category?.trim()) {
    errors.push("الفئة مطلوبة");
  }
  if (!payload.images || payload.images.length === 0) {
    errors.push("صورة واحدة على الأقل مطلوبة");
  }
  
  if (productType === "simple") {
    const merchantPrice = parseNumberOrUndefined(payload.merchantPrice) 
      ?? parseNumberOrUndefined(payload.price);
    
    if (merchantPrice === undefined || merchantPrice <= 0) {
      errors.push("سعر التاجر يجب أن يكون أكبر من 0");
    }
    if (payload.stock === undefined || payload.stock < 0) {
      errors.push("المخزون مطلوب ولا يمكن أن يكون سالباً");
    }
  } else {
    // Variant product validations
    if (!payload.attributes || payload.attributes.length === 0) {
      errors.push("يرجى إضافة خاصية واحدة على الأقل للمنتج");
    }
    if (!payload.variants || payload.variants.length === 0) {
      errors.push("يرجى إضافة متغير واحد على الأقل للمنتج");
    } else {
      // Check variant pricing
      const validationResult = validateVariantPricing(
        payload.variants,
        payload.defaultVariantMerchantPrice
      );
      if (!validationResult.valid) {
        errors.push(...validationResult.errors);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates variant pricing.
 * Ensures every variant can resolve to a valid price.
 */
export function validateVariantPricing(
  variants: FormVariant[],
  defaultVariantMerchantPrice?: number | ""
): ValidationResult {
  const errors: string[] = [];
  const defaultPrice = parseNumberOrUndefined(defaultVariantMerchantPrice);
  
  const variantsWithoutPrice = variants.filter((v) => {
    const variantPrice = parseNumberOrUndefined(v.merchantPrice);
    return variantPrice === undefined || variantPrice <= 0;
  });
  
  if (variantsWithoutPrice.length > 0 && (defaultPrice === undefined || defaultPrice <= 0)) {
    const variantCount = variantsWithoutPrice.length;
    if (variantCount === variants.length) {
      errors.push("جميع المتغيرات ليس لها سعر. يرجى تعيين سعر افتراضي أو إدخال سعر لكل متغير.");
    } else {
      errors.push(
        `${variantCount} متغيرات ليس لها سعر. يرجى تعيين سعر افتراضي أو إدخال سعر لكل متغير.`
      );
    }
  }
  
  // Check for negative prices
  variants.forEach((v, index) => {
    const price = parseNumberOrUndefined(v.merchantPrice);
    if (price !== undefined && price < 0) {
      errors.push(`المتغير ${index + 1}: السعر لا يمكن أن يكون سالباً`);
    }
    if (v.stock < 0) {
      errors.push(`المتغير ${index + 1}: المخزون لا يمكن أن يكون سالباً`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// --------------------------------------------------------------------------
// Helper functions
// --------------------------------------------------------------------------

/**
 * Parses a value to a number, returning undefined if invalid.
 */
function parseNumberOrUndefined(value: number | string | undefined | null): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Gets the resolved price for a variant (for display purposes).
 */
export function getResolvedVariantPrice(
  variant: FormVariant,
  defaultVariantMerchantPrice?: number | ""
): { price: number | undefined; source: "custom" | "default" | "missing" } {
  const variantPrice = parseNumberOrUndefined(variant.merchantPrice);
  const defaultPrice = parseNumberOrUndefined(defaultVariantMerchantPrice);
  
  if (variantPrice !== undefined && variantPrice > 0) {
    return { price: variantPrice, source: "custom" };
  }
  
  if (defaultPrice !== undefined && defaultPrice > 0) {
    return { price: defaultPrice, source: "default" };
  }
  
  return { price: undefined, source: "missing" };
}

/**
 * Calculates the minimum resolved price across all variants.
 * Used for pricing preview.
 */
export function getMinVariantPrice(
  variants: FormVariant[],
  defaultVariantMerchantPrice?: number | "",
  nubianMarkup: number = 10
): number {
  if (variants.length === 0) return 0;
  
  let minPrice = Infinity;
  
  for (const variant of variants) {
    const { price } = getResolvedVariantPrice(variant, defaultVariantMerchantPrice);
    if (price !== undefined && price > 0) {
      const finalPrice = price * (1 + (variant.nubianMarkup ?? nubianMarkup) / 100);
      if (finalPrice < minPrice) {
        minPrice = finalPrice;
      }
    }
  }
  
  return minPrice === Infinity ? 0 : minPrice;
}
