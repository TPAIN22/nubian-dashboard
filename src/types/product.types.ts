/**
 * Shared Product Type Definitions
 * Used across frontend (dashboard) and should match backend structure
 * 
 * These types ensure type safety and consistency between frontend and backend
 */

/**
 * Product attribute definition
 * Defines what attributes a product can have (e.g., Size, Color, Material)
 */
export interface ProductAttribute {
  name: string; // Internal name (e.g., "size", "color", "material")
  displayName: string; // Display name (e.g., "Size", "Color", "Material")
  type: 'select' | 'text' | 'number'; // Attribute input type
  required: boolean; // Whether this attribute is required
  options?: string[]; // Available options (for select type)
}

/**
 * Product variant
 * Represents a specific combination of attributes with its own price, stock, and SKU
 */
export interface ProductVariant {
  _id?: string; // MongoDB ID (if already saved)
  sku: string; // Unique SKU for this variant (e.g., "TSHIRT-RED-L")
  attributes: Record<string, string>; // Attribute values (e.g., { size: "L", color: "Red" })
  price: number; // Variant-specific price
  discountPrice?: number; // Variant-specific discount price
  stock: number; // Variant-specific stock quantity
  images?: string[]; // Variant-specific images (optional)
  isActive: boolean; // Whether this variant is active/available
}

/**
 * Complete Product interface
 * Supports both new variant-based products and legacy simple products
 */
export interface Product {
  _id?: string; // MongoDB ID
  name: string; // Product name
  description: string; // Product description
  category: string | { _id: string; name: string }; // Category ID or populated object
  merchant?: string | { _id: string; businessName: string }; // Merchant ID or populated object
  
  // Images
  images: string[]; // Default/fallback images (at least 1 required)
  
  // New flexible system
  attributes?: ProductAttribute[]; // Attribute definitions (what attributes this product supports)
  variants?: ProductVariant[]; // Product variants (if product has variants)
  
  // Legacy fields (for backward compatibility and simple products)
  price?: number; // Default price (for simple products or fallback)
  discountPrice?: number; // Default discount price
  stock?: number; // Total stock (for simple products) or sum of variant stocks
  sizes?: string[]; // Legacy sizes array (auto-populated from variants if possible)
  colors?: string[]; // Legacy colors array (auto-populated from variants if possible)
  
  // Metadata
  isActive: boolean; // Whether product is active
  averageRating?: number; // Average rating (0-5)
  reviews?: string[]; // Review IDs
  createdAt?: string; // Creation timestamp
  updatedAt?: string; // Last update timestamp
}

/**
 * Product creation/update payload
 * Used when creating or updating products via API
 */
export interface ProductCreatePayload {
  name: string;
  description: string;
  category: string; // Category ID
  images: string[]; // At least 1 image required
  
  // Variant-based product
  attributes?: ProductAttribute[]; // Attribute definitions
  variants?: ProductVariantCreate[]; // Variants to create
  
  // Simple product (no variants)
  price?: number; // Required if no variants
  discountPrice?: number;
  stock?: number; // Required if no variants
  
  // Legacy support
  sizes?: string[]; // Will be converted to variants if attributes exist
  colors?: string[]; // Will be converted to variants if attributes exist
  
  isActive?: boolean;
}

/**
 * Variant creation payload (without _id)
 */
export interface ProductVariantCreate {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  discountPrice?: number;
  stock: number;
  images?: string[];
  isActive?: boolean;
}

/**
 * Product type enum
 * Helps determine how to handle a product
 */
export enum ProductType {
  SIMPLE = 'simple', // No variants, single price/stock
  WITH_VARIANTS = 'with_variants', // Has variants with different prices/stocks
}

/**
 * Helper function to determine product type
 */
export function getProductType(product: Product): ProductType {
  if (product.variants && product.variants.length > 0) {
    return ProductType.WITH_VARIANTS;
  }
  return ProductType.SIMPLE;
}

/**
 * Helper function to check if product has variants
 */
export function hasVariants(product: Product): boolean {
  return getProductType(product) === ProductType.WITH_VARIANTS;
}

/**
 * Helper function to get total stock (sum of variant stocks or product stock)
 */
export function getTotalStock(product: Product): number {
  if (hasVariants(product) && product.variants) {
    return product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  }
  return product.stock || 0;
}

/**
 * Helper function to get all unique attribute values from variants
 * Useful for populating legacy sizes/colors arrays
 */
export function extractAttributeValues(
  variants: ProductVariant[],
  attributeName: string
): string[] {
  const values = new Set<string>();
  variants.forEach(variant => {
    const value = variant.attributes[attributeName];
    if (value) {
      values.add(value);
    }
  });
  return Array.from(values).sort();
}
