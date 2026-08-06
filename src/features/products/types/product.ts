import { formatCurrency } from '@/lib/currency';

/* ============================================================================
   Money envelope
   ----------------------------------------------------------------------------
   `product.price` is NOT a number. The backend serializer
   (`enrichProductWithPricing`) sets a numeric `price` and then spreads a typed
   Money envelope over it — the spread wins, so every enriched endpoint returns
   `price` as an object. Any code doing `formatCurrency(p.price)` or
   `Number.isFinite(p.price)` is reading an object and silently rendering 0.
   ========================================================================== */

export interface Money {
  amount: number;
  currency?: string;
  /** Pre-formatted and currency-aware — prefer it over formatting locally. */
  formatted?: string;
  decimals?: number;
  rate?: number;
}

export interface PriceEnvelope {
  final?: Money;
  original?: Money;
  list?: Money;
  discountAmount?: Money;
  discountPercentage?: number;
  hasDiscount?: boolean;
}

/**
 * The pricing surface every enriched product endpoint returns.
 *
 * `merchantPrice` is **cost** — what the merchant is paid. The engine computes
 * `finalPrice = merchantPrice × (1 + markups) − discounts` with a floor at
 * `merchantPrice`, so `finalPrice >= merchantPrice` always. It is therefore
 * never the strikethrough "was" price, and `finalPrice < merchantPrice` is a
 * predicate that cannot be true. Use `originalPrice` / `hasDiscount` /
 * `discountPercentage` instead; keep `merchantPrice` to internal margin views.
 */
export interface PricedProduct {
  /** Typed Money envelope — the canonical surface. Never a number. */
  price?: PriceEnvelope | null;
  finalPrice?: number;
  /** Strikethrough "was" price. */
  originalPrice?: number;
  listPrice?: number;
  basePrice?: number;
  /** Cost. Internal margin analysis only. */
  merchantPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  hasDiscount?: boolean;
  // Back-compat aliases the serializer still emits.
  displayFinalPrice?: number;
  displayOriginalPrice?: number;
  displayDiscountPercentage?: number;
}

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/** Price the customer is charged. */
export function finalAmount(p: PricedProduct): number {
  return num(p.price?.final?.amount) ?? num(p.finalPrice) ?? num(p.displayFinalPrice) ?? 0;
}

/** Strikethrough "was" price — never `merchantPrice`. */
export function originalAmount(p: PricedProduct): number {
  return (
    num(p.price?.original?.amount) ??
    num(p.originalPrice) ??
    num(p.displayOriginalPrice) ??
    finalAmount(p)
  );
}

export function discountPercentage(p: PricedProduct): number {
  return (
    num(p.price?.discountPercentage) ??
    num(p.discountPercentage) ??
    num(p.displayDiscountPercentage) ??
    0
  );
}

/**
 * Trusts the backend's own predicate. The derivation is a last resort for
 * un-enriched payloads, and still never compares against `merchantPrice`.
 */
export function hasDiscount(p: PricedProduct): boolean {
  if (typeof p.price?.hasDiscount === 'boolean') return p.price.hasDiscount;
  if (typeof p.hasDiscount === 'boolean') return p.hasDiscount;
  return discountPercentage(p) > 0 || originalAmount(p) > finalAmount(p);
}

/** Prefers the envelope's currency-aware string over formatting locally. */
export function formatFinalPrice(p: PricedProduct): string {
  return p.price?.final?.formatted ?? formatCurrency(finalAmount(p));
}

export function formatOriginalPrice(p: PricedProduct): string {
  return p.price?.original?.formatted ?? formatCurrency(originalAmount(p));
}

/* ========================================================================== */

export interface ProductVariant extends PricedProduct {
  _id: string;
  sku: string;
  attributes: Record<string, string>;
  merchantPrice: number;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  merchantDiscount?: number;
  finalPrice: number;
  stock: number;
  images: string[];
  isActive: boolean;
}

export interface Product extends PricedProduct {
  _id: string;
  name: string;
  description: string;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  // Total active stock (derived from variants by controller/virtual)
  stock?: number;
  isActive: boolean;
  images: string[];
  // Variant-first architecture
  variants: ProductVariant[];
  category?: {
    _id: string;
    name: string;
  } | string;
  merchant?: {
    _id: string;
    businessName: string;
    businessEmail: string;
    status?: string;
  };
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Admin-controlled ranking fields (top-level on schema)
  priorityScore?: number;
  featured?: boolean;
  averageRating?: number;
  status?: 'active' | 'draft' | 'archived';
}

export interface ProductFilters {
  category?: string;
  merchant?: string;
  isActive?: string;
  includeDeleted?: string; // 'true' | 'false'
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}
