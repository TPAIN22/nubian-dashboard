import { ProductAttributeDefDTO, ProductVariantDTO } from "@/domain/product/product.types";

/**
 * Generates a deterministically stable SKU.
 */
function generateSku(attrs: Record<string, string>): string {
  // e.g. PROD-RED-L-1234
  // We want it slightly stable but unique enough. 
  // actually, let's stick to the existing logic: PROD-[OPTIONS]-[RANDOM]
  // to avoid collisions.
  const parts = Object.values(attrs).map(v => 
    String(v).toUpperCase().replace(/[^A-Z0-9]/g, '')
  );
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PROD-${parts.join('-')}-${random}`;
}

/**
 * Generates all possible variant combinations based on attributes.
 * Preserves existing variants if they match the combination.
 */
export function generateVariantsFromAttributes(
  attributes: ProductAttributeDefDTO[],
  existingVariants: ProductVariantDTO[]
): ProductVariantDTO[] {
  // 1. Filter valid attributes (must have name + options)
  const validAttrs = attributes.filter(
    (a) => a.name && a.options && a.options.length > 0
  );

  if (validAttrs.length === 0) return [];

  // 2. Generate Cartesian Product of options
  // attrs = [{name: 'Color', options:['Red', 'Blue']}, {name: 'Size', options:['S','M']}]
  // combinations = [{Color:'Red', Size:'S'}, {Color:'Red', Size:'M'}, ...]

  const combos: Record<string, string>[] = [{}];

  validAttrs.forEach((attr) => {
    const currentCombos = [...combos];
    combos.length = 0; // clear

    const options = attr.options || [];
    currentCombos.forEach((parentCombo) => {
      options.forEach((opt) => {
        combos.push({
          ...parentCombo,
          [attr.name]: opt,
        });
      });
    });
  });

  // 3. Map combinations to variants
  const newVariants: ProductVariantDTO[] = combos.map((combo) => {
    // Check if a variant already exists with these exact attributes
    const existing = existingVariants.find((v) => {
      const vAttrs = v.attributes || {};
      const keysA = Object.keys(combo);
      const keysB = Object.keys(vAttrs);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((k) => vAttrs[k] === combo[k]);
    });

    if (existing) {
      return existing; // Keep stock, price, id, images
    }

    // Create new
    return {
      sku: generateSku(combo),
      attributes: combo,
      merchantPrice: 0, // default
      price: 0,
      stock: 0,
      isActive: true,
      images: [], 
      nubianMarkup: 10,
    };
  });

  return newVariants;
}
