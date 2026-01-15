/**
 * DEPRECATED: Use `@/domain/product/product.types` directly.
 * This file is kept as a thin re-export while callers are migrated.
 */

export type {
  ProductDTO as Product,
  ProductVariantDTO as ProductVariant,
  ProductAttributeDefDTO as ProductAttribute,
  ProductCreatePayloadDTO as ProductCreatePayload,
  ProductVariantCreateDTO as ProductVariantCreate,
} from "@/domain/product/product.types";
