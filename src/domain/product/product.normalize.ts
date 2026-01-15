import type { ProductAttributeDefDTO, ProductDTO, ProductVariantDTO } from "./product.types";

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
    finalPrice: asNum(v?.finalPrice) ?? undefined,
    discountPrice: asNum(v?.discountPrice) ?? undefined,
    stock: Number(v?.stock ?? 0),
    images: asStringArray(v?.images),
    isActive: asBool(v?.isActive, true),
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

    simple: {
      stock: variants.length ? null : asNum(raw?.stock),
      merchantPrice: variants.length ? null : asNum(raw?.merchantPrice),
      finalPrice: variants.length ? null : asNum(raw?.finalPrice),
    },
  };
}

