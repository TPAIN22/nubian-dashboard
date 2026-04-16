import { ProductVariantDTO } from "@/domain/product/product.types";

export interface MatrixRow {
  rowKey: string; // e.g. "Red"
  cells: Record<string, ProductVariantDTO | undefined>; // colKey (Size) -> Variant
}

export interface MatrixData {
  rows: MatrixRow[];
  colKeys: string[]; // e.g. ["S", "M", "L"]
}

/**
 * Pivots flat variants into a matrix structure.
 * Usually Row = Color, Col = Size.
 */
export function buildStockMatrix(
  variants: ProductVariantDTO[],
  rowAttrName: string = "color",
  colAttrName: string = "size"
): MatrixData {
  const colKeysSet = new Set<string>();
  const rowMap = new Map<string, MatrixRow>();

  // Normalize attribute names for case-insensitive lookup if needed, 
  // but usually we expect strict matching from generation.
  // We'll trust exact matches for now.

  for (const v of variants) {
    const attrs = v.attributes || {};
    
    // Find keys ignoring case? Or assume generation normalized them?
    // Generation uses whatever was typed in Attribute Definition (e.g. "Color").
    // We should probably search loosely.
    const rKey = findAttrValue(attrs, rowAttrName) || "N/A";
    const cKey = findAttrValue(attrs, colAttrName) || "Default";

    colKeysSet.add(cKey);

    if (!rowMap.has(rKey)) {
      rowMap.set(rKey, { rowKey: rKey, cells: {} });
    }
    const row = rowMap.get(rKey)!;
    row.cells[cKey] = v;
  }

  // Sort columns logically if possible? (S, M, L, XL...) 
  // For now, simple string sort or insertion order.
  const colKeys = Array.from(colKeysSet).sort();

  return {
    rows: Array.from(rowMap.values()),
    colKeys,
  };
}

function findAttrValue(attrs: Record<string, string>, searchName: string): string | undefined {
  const keys = Object.keys(attrs);
  const match = keys.find(k => k.toLowerCase() === searchName.toLowerCase());
  return match ? attrs[match] : undefined;
}
