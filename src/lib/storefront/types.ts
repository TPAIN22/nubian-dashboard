/**
 * Storefront view models.
 *
 * The backend's product payload is a wide document: raw schema fields, the
 * pricing engine's intermediate values, the per-variant breakdown and the
 * currency-converted display block all travel together. These types are the
 * narrow slice the public pages actually render, produced by `normalize.ts`.
 *
 * Nothing here is invented. Every field maps to something the backend sent;
 * fields the backend cannot answer (a rating nobody has left, a discount that
 * is not active) are optional and the components hide them rather than
 * substituting a default.
 */

/** One currency-converted amount, exactly as the backend's pricing engine emits it. */
export interface StorefrontMoney {
  amount: number;
  currency: string;
  /** Backend-formatted string. Kept for provenance; the UI formats via `lib/currency`. */
  formatted?: string;
  /** True when FX had no rate for this currency and the amount fell back to base. */
  rateUnavailable?: boolean;
}

export interface StorefrontPrice {
  final: StorefrontMoney;
  /** Pre-discount price. Only present — and only rendered — when a discount is live. */
  original?: StorefrontMoney;
  discountPercentage?: number;
  hasDiscount: boolean;
}

export interface StorefrontCategoryRef {
  id: string;
  name: string;
}

export interface StorefrontStoreRef {
  id: string;
  name: string;
  logo?: string | null;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  description?: string;
  /** Deduplicated, non-empty image URLs. May be empty — the card handles that. */
  images: string[];
  price: StorefrontPrice | null;
  category: StorefrontCategoryRef | null;
  store: StorefrontStoreRef | null;
  /** Total units across variants. `null` when the backend did not report it. */
  stock: number | null;
  variants: StorefrontVariant[];
}

export interface StorefrontVariant {
  id: string;
  sku?: string;
  attributes: Record<string, string>;
  stock: number | null;
  price: StorefrontPrice | null;
  images: string[];
}

export interface StorefrontCategory {
  id: string;
  name: string;
  description?: string;
  image: string | null;
  /** Top-level categories have no parent; the home grid shows these first. */
  parentId: string | null;
}

export interface StorefrontCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string | null;
  productCount: number;
}

export interface StorefrontStore {
  id: string;
  name: string;
  description?: string;
  logo: string | null;
  banner: string | null;
  city?: string | null;
}

export interface StorefrontBanner {
  id: string;
  image: string;
  title?: string;
  description?: string;
}

/** The public `/api/home` feed, normalized. */
export interface StorefrontHomeFeed {
  banners: StorefrontBanner[];
  categories: StorefrontCategory[];
  collections: StorefrontCollection[];
  /**
   * The backend currently derives `trending`, `forYou` and `brandsYouLove`
   * from one ranked list, so they arrive identical. The homepage renders a
   * single product section rather than three headings over the same products;
   * see `getHomeFeed` for the dedupe.
   */
  products: StorefrontProduct[];
  newArrivals: StorefrontProduct[];
  stores: StorefrontStore[];
}

export interface StorefrontPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
