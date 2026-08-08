/**
 * Dashboard-side pricing engine — the app's SINGLE pricing implementation.
 *
 * ===========================================================================
 * SOURCE OF TRUTH: apps/backend/src/lib/pricing.engine.js
 *   - isProductDiscountActive        → lines 32–40
 *   - computeProductDiscountAmount   → lines 46–55
 *   - calculateFinalPrice            → lines 61–128
 * ===========================================================================
 *
 * This is a deliberate, line-for-line mirror so an admin previews the SAME
 * number the shopper is charged. It exists only because the product wizard has
 * to show a price BEFORE the product is saved and the backend can answer. The
 * moment a server-computed `finalPrice` is available it wins — every consumer
 * prefers the enriched value and falls back to this module only for unsaved
 * drafts and legacy un-enriched payloads.
 *
 * WHY THIS IS A MODULE AND NOT PART OF A COMPONENT
 * This logic previously lived inside `components/product/PricingPreview.tsx`,
 * so `VariantPricingPreview`, `ProductWizard` and the shop-side resolver each
 * imported pricing math out of a React presentational component — and
 * `lib/pricing.ts` kept its own second copy of the markup formula rather than
 * import from a `.tsx`. Everything now imports from here instead, so there is
 * exactly one place to change when the backend engine changes.
 *
 * If you change the backend engine, change this too — and keep the order of
 * operations identical, especially:
 *   * the cost floor applies ONLY when no human-set discount exists (engine:100)
 *   * originalPrice = max(listed, surged)                          (engine:106)
 *
 * Keep this file free of React and of `next/*` imports: it is plain TypeScript
 * so it can be used from server components, route handlers and client code
 * alike.
 */

import { DEFAULT_NUBIAN_MARKUP } from "@/lib/pricing.config";
import type { ProductDiscountDTO } from "@/domain/product/product.types";

/** Round to 2dp the same way the backend engine does (`pricing.engine.js:26`). */
export const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export interface EnginePricingResult {
  basePrice: number;
  listPrice: number;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  hasDiscount: boolean;
  breakdown: {
    merchantPrice: number;
    nubianMarkup: number;
    dynamicMarkup: number;
    variantDiscount: number;
    productDiscount: number;
  };
}

export interface EnginePricingInput {
  merchantPrice?: number;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  /** Per-variant absolute amount off. NOT a percentage. */
  merchantDiscount?: number;
  /** Product-level discount block; applies to every variant. */
  discount?: ProductDiscountDTO | null;
  /** Injectable clock so a scheduled sale can be previewed deterministically. */
  now?: Date;
}

/** Mirrors `isProductDiscountActive` (pricing.engine.js:32–40). */
export function isProductDiscountActive(
  discount: ProductDiscountDTO | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!discount || !discount.isActive) return false;
  if (!(Number(discount.value) > 0)) return false;
  if (discount.type !== "percentage" && discount.type !== "fixed") return false;
  const t = now.getTime();
  if (discount.startsAt && new Date(discount.startsAt).getTime() > t) return false;
  if (discount.endsAt && new Date(discount.endsAt).getTime() < t) return false;
  return true;
}

/**
 * Why an enabled discount is nevertheless doing nothing right now. `null` when
 * it IS live. Purely for admin feedback — the engine has no such concept.
 */
export type DiscountInactiveReason =
  | "disabled"
  | "no-value"
  | "no-type"
  | "not-started"
  | "expired";

export function discountInactiveReason(
  discount: ProductDiscountDTO | null | undefined,
  now: Date = new Date(),
): DiscountInactiveReason | null {
  if (!discount || !discount.isActive) return "disabled";
  if (discount.type !== "percentage" && discount.type !== "fixed") return "no-type";
  if (!(Number(discount.value) > 0)) return "no-value";
  const t = now.getTime();
  if (discount.startsAt && new Date(discount.startsAt).getTime() > t) return "not-started";
  if (discount.endsAt && new Date(discount.endsAt).getTime() < t) return "expired";
  return null;
}

/** Mirrors `computeProductDiscountAmount` (pricing.engine.js:46–55). */
export function computeProductDiscountAmount(
  price: number,
  discount: ProductDiscountDTO | null | undefined,
  now: Date = new Date(),
): number {
  if (!isProductDiscountActive(discount, now)) return 0;
  const p = Math.max(0, Number(price) || 0);
  const v = Math.max(0, Number(discount!.value) || 0);
  let amount = discount!.type === "percentage" ? (p * v) / 100 : v;
  const cap = Number(discount!.maxDiscount);
  if (discount!.type === "percentage" && cap > 0) {
    amount = Math.min(amount, cap);
  }
  return Math.min(amount, p);
}

/** Mirrors `calculateFinalPrice` (pricing.engine.js:61–128). */
export function computeEnginePricing({
  merchantPrice = 0,
  nubianMarkup = DEFAULT_NUBIAN_MARKUP,
  dynamicMarkup = 0,
  merchantDiscount = 0,
  discount = null,
  now = new Date(),
}: EnginePricingInput): EnginePricingResult {
  const base = Math.max(0, Number(merchantPrice) || 0);
  const markup = Math.max(0, Number(nubianMarkup ?? DEFAULT_NUBIAN_MARKUP));
  const dynamic = Number(dynamicMarkup || 0);

  // THE ONE DELIBERATE DIVERGENCE from the backend engine.
  //
  // With merchantPrice 0 the backend still runs its `if (final < 1) final = 1`
  // floor and returns finalPrice 1. Here we return zeros so an unpriced draft
  // renders "—" instead of advertising a 1 USD product to the admin. This is
  // unreachable as a real product state: the wizard's zod schema requires
  // merchantPrice >= 1 and the backend rejects a variant with merchantPrice 0,
  // so nothing that can be SAVED takes this branch.
  //
  // Verified: over 1440 input combinations (prices 1–1000 × markups 0–200 ×
  // dynamic markups -20–12.5 × merchant discounts 0–500 × 8 discount blocks
  // incl. caps, >100%, fixed, inactive, expired and scheduled windows) this
  // module and pricing.engine.js agree on every field, exactly. merchantPrice 0
  // is the sole case where they differ.
  if (base <= 0) {
    return {
      basePrice: 0,
      listPrice: 0,
      originalPrice: 0,
      finalPrice: 0,
      discountAmount: 0,
      discountPercentage: 0,
      hasDiscount: false,
      breakdown: {
        merchantPrice: 0,
        nubianMarkup: markup,
        dynamicMarkup: dynamic,
        variantDiscount: 0,
        productDiscount: 0,
      },
    };
  }

  const listed = round2(base * (1 + markup / 100));
  const surged = round2(base + (base * markup) / 100 + (base * dynamic) / 100);

  // Both discounts apply on top of the surged price, and they STACK.
  const variantDiscount = Math.max(0, Number(merchantDiscount) || 0);
  const productDiscount = computeProductDiscountAmount(surged, discount, now);
  const totalDiscount = variantDiscount + productDiscount;

  // Cost floor — engine line 100. Only protects cost when NO human set a
  // discount; a merchant is allowed to deliberately sell below cost.
  let final = round2(surged - totalDiscount);
  if (final < base && totalDiscount === 0) final = base;
  if (final < 1) final = 1;

  const originalPrice = round2(Math.max(listed, surged));
  const discountAmount = originalPrice > final ? round2(originalPrice - final) : 0;
  const discountPercentage =
    originalPrice > 0 && discountAmount > 0
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0;

  return {
    basePrice: base,
    listPrice: listed,
    originalPrice,
    finalPrice: final,
    discountAmount,
    discountPercentage,
    hasDiscount: discountAmount > 0,
    breakdown: {
      merchantPrice: base,
      nubianMarkup: markup,
      dynamicMarkup: dynamic,
      variantDiscount,
      productDiscount: round2(productDiscount),
    },
  };
}
