// Backend Product schema contract (authoritative).
// Synced manually from `nubian-auth/src/models/product.model.js`.

export type ObjectIdString = string;

export type ProductAttributeType = "select" | "text" | "number";

/**
 * Product-level discount block (`product.discount` in product.model.js:55–69).
 *
 * Applies to EVERY variant and stacks on top of `variant.merchantDiscount`.
 * `value` is a percentage when `type === "percentage"`, otherwise an absolute
 * currency amount. `maxDiscount` caps percentage discounts only.
 *
 * The engine (backend lib/pricing.engine.js `isProductDiscountActive`) treats a
 * discount as live only when `isActive` is true, `value > 0`, `type` is valid,
 * AND `now` sits inside the `startsAt`/`endsAt` window. `isActive: true` alone
 * is NOT enough.
 */
export type ProductDiscountType = "percentage" | "fixed";

export type ProductDiscountDTO = {
  type?: ProductDiscountType | null;
  value?: number;
  maxDiscount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
};

/**
 * What a writer must send. `sanitizeDiscountInput`
 * (backend products.controller.js:617) rewrites the whole block on every save,
 * so a PARTIAL payload cannot reliably switch a sale off — always send all six
 * keys, including an explicit `isActive`.
 */
export type ProductDiscountInputDTO = Required<{
  [K in keyof ProductDiscountDTO]: ProductDiscountDTO[K];
}>;

export type ProductAttributeDefDTO = {
  _id?: ObjectIdString; // backend subdoc has _id
  name: string; // backend: lowercase
  displayName: string;
  type?: ProductAttributeType;
  required?: boolean;
  options?: string[];
};

export type ProductVariantDTO = {
  _id?: ObjectIdString;
  sku: string;
  attributes: Record<string, string>;

  merchantPrice: number;
  price: number; // legacy mirror

  nubianMarkup?: number;
  dynamicMarkup?: number;
  /**
   * Per-variant discount as an ABSOLUTE currency amount off the surged price —
   * never a percentage (product.model.js:26, `min: 0`, default 0). Stacks with
   * the product-level `discount` block.
   */
  merchantDiscount?: number;

  // Authoritative pricing block from backend pricing engine.
  basePrice?: number;
  listPrice?: number;
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  hasDiscount?: boolean;

  // Legacy field — back-compat with old simple products.
  discountPrice?: number;

  stock: number;
  images?: string[];
  isActive: boolean;
};

export type ProductCategoryDTO =
  | ObjectIdString
  | {
      _id: ObjectIdString;
      name?: string;
      parent?: ObjectIdString | { _id: ObjectIdString; name?: string } | null;
    };

export type ProductDTO = {
  _id?: ObjectIdString;
  name: string;
  description: string;

  // simple products
  merchantPrice?: number;
  price?: number;
  stock?: number;

  nubianMarkup?: number;
  dynamicMarkup?: number;

  // Authoritative root pricing block (lowest active variant when applicable).
  basePrice?: number;
  listPrice?: number;
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  hasDiscount?: boolean;
  discount?: ProductDiscountDTO | null;

  // Legacy field — back-compat with old simple products.
  discountPrice?: number;

  // legacy fields still present in backend schema
  sizes?: string[];
  colors?: string[];

  attributes?: ProductAttributeDefDTO[];
  variants?: ProductVariantDTO[];

  isActive?: boolean;

  priorityScore?: number;
  featured?: boolean;

  trackingFields?: {
    views24h: number;
    cartCount24h: number;
    sales24h: number;
    favoritesCount: number;
  };

  rankingFields?: {
    visibilityScore: number;
    conversionRate: number;
    storeRating: number;
    priorityScore: number;
    featured: boolean;
  };

  visibilityScore?: number;
  scoreCalculatedAt?: string | null;

  category: ProductCategoryDTO;
  images: string[];
  averageRating?: number;
  reviews?: ObjectIdString[];

  merchant?: ObjectIdString | null;
  deletedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

// Create/update payloads (backend-driven contract; no frontend inference helpers)
export type ProductVariantCreateDTO = Omit<ProductVariantDTO, "_id"> & { _id?: never };
export type ProductCreatePayloadDTO = Omit<
  ProductDTO,
  "_id" | "createdAt" | "updatedAt" | "discount"
> & {
  variants?: ProductVariantCreateDTO[];
  /**
   * Always the COMPLETE block — see ProductDiscountInputDTO. Omit the key
   * entirely to leave an existing discount untouched on PUT; send the cleared
   * block (`{ type: null, value: 0, …, isActive: false }`) to end a sale.
   */
  discount?: ProductDiscountInputDTO;
};

