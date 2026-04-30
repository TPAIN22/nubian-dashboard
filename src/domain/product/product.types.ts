// Backend Product schema contract (authoritative).
// Synced manually from `nubian-auth/src/models/product.model.js`.

export type ObjectIdString = string;

export type ProductAttributeType = "select" | "text" | "number";

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
  discount?: {
    type?: 'percentage' | 'fixed' | null;
    value?: number;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    maxDiscount?: number | null;
  } | null;

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
export type ProductCreatePayloadDTO = Omit<ProductDTO, "_id" | "createdAt" | "updatedAt"> & {
  variants?: ProductVariantCreateDTO[];
};

