import { ProductVariantDTO } from "@/domain/product/product.types";

/**
 * Applies color-specific images to all variants of that color.
 * Returns a NEW array of variants (immutable).
 */
export function applyColorImagesToVariants(
  variants: ProductVariantDTO[],
  colorImagesMap: Record<string, string[]>,
  colorAttrName: string = "color"
): ProductVariantDTO[] {
  return variants.map(v => {
    const attrs = v.attributes || {};
    // find color value
    const keys = Object.keys(attrs);
    const colorKey = keys.find(k => k.toLowerCase() === colorAttrName.toLowerCase());
    
    if (!colorKey) return v; // no color attribute

    const colorVal = attrs[colorKey];
    const images = colorImagesMap[colorVal];

    if (images && images.length > 0) {
      if (areImagesDifferent(v.images || [], images)) {
        return {
           ...v, 
           images: [...images] 
        };
      }
    }
    return v;
  });
}

function areImagesDifferent(a: string[], b: string[]) {
  if (a.length !== b.length) return true;
  const setA = new Set(a);
  return !b.every(x => setA.has(x));
}
