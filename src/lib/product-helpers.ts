import { ProductVariant } from "@/types/product.types";

/**
 * Distributes properties (images, price, etc.) to all variants sharing the same color.
 */
export function distributeColorProperties(
  variants: ProductVariant[],
  colorAttributeName: string,
  colorValue: string,
  updates: { images?: string[]; merchantPrice?: number; price?: number; nubianMarkup?: number }
): ProductVariant[] {
  return variants.map((v) => {
    const attrs =
      v.attributes instanceof Map
        ? Object.fromEntries(v.attributes)
        : v.attributes || {};

    // Case-insensitive check for the color attribute key
    const colorKey = Object.keys(attrs).find(
      (k) => k.toLowerCase() === colorAttributeName.toLowerCase()
    );

    // If this variant matches the color
    if (colorKey && attrs[colorKey] === colorValue) {
      // Merge updates
      const newVariant = { ...v, ...updates };

      // Ensure price fields are number or undefined (handle empty string case if coming from input)
      if (updates.merchantPrice !== undefined) {
         newVariant.merchantPrice = updates.merchantPrice === 0 && updates.merchantPrice !== 0 ? undefined as any : updates.merchantPrice; 
         newVariant.price = newVariant.merchantPrice; // Mirror for legacy
      }

      return newVariant;
    }
    return v;
  });
}

/**
 * Validates that every active color group has at least one image.
 */
export function validateColorCoverage(
  variants: ProductVariant[],
  colorAttributeName: string
): { valid: boolean; missingColors: string[] } {
  const activeVariants = variants.filter((v) => v.isActive !== false);
  const colorGroups: Record<string, boolean> = {}; // color -> hasImages
  const seenColors = new Set<string>();

  activeVariants.forEach((v) => {
    const attrs =
      v.attributes instanceof Map
        ? Object.fromEntries(v.attributes)
        : v.attributes || {};
    
    const colorKey = Object.keys(attrs).find(
      (k) => k.toLowerCase() === colorAttributeName.toLowerCase()
    );

    if (colorKey) {
        const color = attrs[colorKey];
        seenColors.add(color);

        // If this variant has images, the group is potentially good
        if (v.images && v.images.length > 0) {
            colorGroups[color] = true;
        }
    }
  });

  const missingColors = Array.from(seenColors).filter(color => !colorGroups[color]);

  return {
    valid: missingColors.length === 0,
    missingColors,
  };
}
