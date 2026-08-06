import type {
  ProductAttributeDefDTO,
  ProductDiscountDTO,
  ProductDTO,
  ProductVariantDTO,
} from "./product.types";

export type NormalizedProduct = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  deletedAt: string | null;

  categoryId: string;
  categoryName?: string;

  merchantId: string | null;
  images: string[];

  attributeDefs: ProductAttributeDefDTO[];
  variants: ProductVariantDTO[];

  /**
   * Product-level discount block, normalised to a complete shape (never a
   * partial). `null` means "no discount block stored". Per-variant
   * `merchantDiscount` stays on each entry of `variants`.
   */
  discount: ProductDiscountDTO | null;

  simple: {
    stock: number | null;
    merchantPrice: number | null;
    finalPrice: number | null;
  };
};

const asString = (v: any) => (typeof v === "string" ? v : v == null ? "" : String(v));
const asBool = (v: any, fb = false) => (typeof v === "boolean" ? v : fb);
const asNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const asStringArray = (v: any) => (Array.isArray(v) ? v.map(asString).filter(Boolean) : []);

function normalizeVariant(v: any): ProductVariantDTO {
  return {
    _id: asString(v?._id),
    sku: asString(v?.sku),
    attributes: (v?.attributes && typeof v.attributes === "object") ? v.attributes : {},
    merchantPrice: Number(v?.merchantPrice ?? v?.price ?? 0),
    price: Number(v?.price ?? v?.merchantPrice ?? 0),
    nubianMarkup: asNum(v?.nubianMarkup) ?? undefined,
    dynamicMarkup: asNum(v?.dynamicMarkup) ?? undefined,
    merchantDiscount: asNum(v?.merchantDiscount) ?? undefined,

    basePrice:          asNum(v?.basePrice) ?? undefined,
    listPrice:          asNum(v?.listPrice) ?? undefined,
    originalPrice:      asNum(v?.originalPrice) ?? undefined,
    finalPrice:         asNum(v?.finalPrice) ?? undefined,
    discountAmount:     asNum(v?.discountAmount) ?? undefined,
    discountPercentage: asNum(v?.discountPercentage) ?? undefined,
    hasDiscount:        typeof v?.hasDiscount === "boolean" ? v.hasDiscount : undefined,

    discountPrice: asNum(v?.discountPrice) ?? undefined,
    stock: Number(v?.stock ?? 0),
    images: asStringArray(v?.images),
    isActive: asBool(v?.isActive, true),
  };
}

const asIso = (v: any): string | null => {
  if (v == null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/**
 * Normalise `product.discount` into a complete block, or `null` when the
 * product carries none. Kept lossless: an expired-but-enabled discount still
 * round-trips as `isActive: true` with its window, because whether it is
 * currently LIVE is the pricing engine's call, not this mapper's.
 */
function normalizeDiscount(d: any): ProductDiscountDTO | null {
  if (!d || typeof d !== "object") return null;
  const type = d.type === "percentage" || d.type === "fixed" ? d.type : null;
  const value = asNum(d.value) ?? 0;
  const maxDiscount = asNum(d.maxDiscount);
  const startsAt = asIso(d.startsAt);
  const endsAt = asIso(d.endsAt);
  const isActive = asBool(d.isActive, false);

  // A block with nothing set at all is indistinguishable from "no discount".
  if (!type && value === 0 && !isActive && !startsAt && !endsAt) return null;

  return {
    type,
    value,
    maxDiscount: maxDiscount != null && maxDiscount > 0 ? maxDiscount : null,
    startsAt,
    endsAt,
    isActive,
  };
}

function normalizeAttrDef(a: any): ProductAttributeDefDTO {
  return {
    _id: a?._id ? asString(a._id) : undefined,
    name: asString(a?.name).trim().toLowerCase(),
    displayName: asString(a?.displayName).trim(),
    type: a?.type,
    required: asBool(a?.required, false),
    options: asStringArray(a?.options),
  };
}

export function normalizeProduct(raw: ProductDTO): NormalizedProduct {
  const category = raw?.category as any;
  const categoryId = typeof category === "string" ? category : asString(category?._id);
  const categoryName = typeof category === "object" && category ? asString(category?.name) || undefined : undefined;

  const variants = Array.isArray(raw?.variants) ? raw.variants.map(normalizeVariant) : [];
  const attributeDefs = Array.isArray(raw?.attributes) ? raw.attributes.map(normalizeAttrDef) : [];

  return {
    id: asString(raw?._id),
    name: asString(raw?.name),
    description: asString(raw?.description),
    isActive: raw?.isActive === false ? false : true,
    deletedAt: raw?.deletedAt ? asString(raw.deletedAt) : null,

    categoryId,
    categoryName,

    merchantId: raw?.merchant == null ? null : asString(raw.merchant),
    images: asStringArray(raw?.images),

    attributeDefs,
    variants,

    discount: normalizeDiscount(raw?.discount),

    simple: {
      stock: variants.length ? null : asNum(raw?.stock),
      merchantPrice: variants.length ? null : asNum(raw?.merchantPrice),
      finalPrice: variants.length ? null : asNum(raw?.finalPrice),
    },
  };
}

