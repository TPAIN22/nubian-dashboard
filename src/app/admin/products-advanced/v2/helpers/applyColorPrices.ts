import { ProductVariantDTO } from "@/domain/product/product.types";

/**
 * Applies color-specific price/pricing logic to variants.
 * In this system, merchantPrice is the base. 
 * price is a legacy mirror of merchantPrice.
 */
export function applyColorPricesToVariants(
  variants: ProductVariantDTO[],
  colorPricesMap: Record<string, number>,
  colorAttrName: string = "color"
): ProductVariantDTO[] {
  return variants.map(v => {
    const attrs = v.attributes || {};
    const keys = Object.keys(attrs);
    const colorKey = keys.find(k => k.toLowerCase() === colorAttrName.toLowerCase());
    
    if (!colorKey) return v;

    const colorVal = attrs[colorKey];
    const newPrice = colorPricesMap[colorVal];

    // Only apply if strictly defined number (allowing 0 if free, but usually >0)
    if (typeof newPrice === 'number') {
      if (v.merchantPrice !== newPrice) {
        return { 
          ...v, 
          merchantPrice: newPrice,
          price: newPrice 
        };
      }
    }

    return v;
  });
}
