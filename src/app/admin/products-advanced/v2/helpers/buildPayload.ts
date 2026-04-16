import { WizardState } from "../types";
import { ProductCreatePayloadDTO, ProductVariantCreateDTO } from "@/domain/product/product.types";
import { applyColorImagesToVariants } from "./applyColorImages";
import { applyColorPricesToVariants } from "./applyColorPrices";

export function buildProductPayload(state: WizardState): ProductCreatePayloadDTO {
  // For variants, we need to apply the color images and prices one last time 
  // (or ensure they are kept in sync).
  
  let finalVariants: ProductVariantCreateDTO[] = [];

  if (state.productType === "with_variants") {
    // 1. Sync Images
    const processed = applyColorImagesToVariants(state.variants, state.colorImages);
    
    // 2. Sync Prices (if not already synced in state)
    // We already keep variants updated, but let's double check if we want to enforce it at save time?
    // Actually, the user might have manually edited a specific variant price in the Matrix (not yet implemented in plan, but possible).
    // The plan said: "Pricing Step: Apply to all variants of that color".
    // Let's assume the state.variants are already up to date because the UI updates them on change.
    // So we just use state.variants.
    
    // However, we must ensure the structure is correct.
    // remove _id if it's empty or new?
    
    finalVariants = processed.map(v => ({
      sku: v.sku,
      attributes: v.attributes,
      merchantPrice: v.merchantPrice || 0,
      price: v.merchantPrice || 0, // legacy mirror
      stock: v.stock || 0,
      images: v.images || [],
      isActive: v.isActive,
      nubianMarkup: v.nubianMarkup || 10,
    }));
  }

  const payload: ProductCreatePayloadDTO = {
    name: state.name,
    description: state.description,
    category: state.category as any, // ID string
    images: state.images,
    isActive: state.isActive,
    
    // Simple Product Fields
    merchantPrice: state.productType === "simple" ? state.price : undefined,
    price: state.productType === "simple" ? state.price : undefined,
    stock: state.productType === "simple" ? state.stock : undefined,
    
    // Variants
    attributes: state.productType === "with_variants" ? state.attributes : undefined,
    variants: state.productType === "with_variants" ? finalVariants : undefined,
    
    sizes: state.productType === "with_variants" ? extractUnique(state.variants, 'Size') : [],
    colors: state.productType === "with_variants" ? extractUnique(state.variants, 'Color') : [],
  };

  return payload;
}

function extractUnique(variants: any[], attrName: string): string[] {
  const set = new Set<string>();
  variants.forEach((v: any) => {
    const val = findAttr(v.attributes, attrName);
    if (val) set.add(val);
  });
  return Array.from(set);
}

function findAttr(attrs: any, name: string): string | undefined {
  if (!attrs) return undefined;
  const key = Object.keys(attrs).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? attrs[key] : undefined;
}
