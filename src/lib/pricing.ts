import { ProductDTO, ProductVariantDTO } from "@/types/shop";

export interface ResolvedPrice {
  final: number;
  merchant: number;
  original: number;
  currency: string;
  source: "simple" | "variant";
  discount?: {
    amount: number;
    percentage: number;
  };
  breakdown?: {
    merchantPrice: number;
    nubianMarkup: number;
    dynamicMarkup: number;
    finalPrice: number;
  };
  requiresSelection?: boolean;
}

export interface PricingOptions {
  product?: ProductDTO;
  selectedVariant?: ProductVariantDTO;
  currency?: string;
}

/**
 * Authoritative pricing resolver for the shop.
 *
 * The backend (lib/pricing.engine.js → enrichProductWithPricing) is the source
 * of truth: it writes finalPrice / originalPrice / discountAmount /
 * discountPercentage onto every product AND every variant. This function
 * trusts those fields. We only fall back to local math when the response
 * comes from a legacy endpoint that didn't enrich.
 */
export function resolvePrice({
  product,
  selectedVariant,
  currency = "SDG",
}: PricingOptions): ResolvedPrice {
  if (!product) {
    return { final: 0, merchant: 0, original: 0, currency, source: "simple" };
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;

  if (hasVariants) {
    if (!selectedVariant) {
      return resolveFromPrice(product, variants, currency);
    }
    return resolveVariant(selectedVariant, currency);
  }

  return resolveSimple(product, currency);
}

// ── Variant product, no variant selected (listing card "From X") ────────────
function resolveFromPrice(
  product: ProductDTO,
  variants: ProductVariantDTO[],
  currency: string,
): ResolvedPrice {
  // Prefer the root pricing block the backend already chose (cheapest active variant).
  if (product.finalPrice && product.finalPrice > 0 && product.originalPrice) {
    const final = product.finalPrice;
    const original = product.originalPrice;
    return withDiscount({
      final,
      merchant: product.basePrice ?? product.merchantPrice ?? final,
      original,
      currency,
      source: "variant",
      requiresSelection: true,
      backendDiscount: {
        amount: product.discountAmount,
        percentage: product.discountPercentage,
      },
    });
  }

  // Fallback: pick cheapest variant locally.
  const priced = variants
    .filter((v) => v.isActive !== false)
    .map((v) => resolveVariant(v, currency))
    .filter((p) => p.final > 0)
    .sort((a, b) => a.final - b.final);

  const cheapest = priced[0];
  if (!cheapest) {
    return { final: 0, merchant: 0, original: 0, currency, source: "variant", requiresSelection: true };
  }
  return { ...cheapest, requiresSelection: true };
}

// ── Variant product, variant selected ────────────────────────────────────────
function resolveVariant(variant: ProductVariantDTO, currency = "SDG"): ResolvedPrice {
  const merchant = variant.merchantPrice ?? variant.basePrice ?? 0;

  // Trust the backend pricing block when present.
  if (variant.finalPrice !== undefined && variant.finalPrice > 0) {
    const final = variant.finalPrice;
    const original = variant.originalPrice ?? variant.listPrice ?? final;
    return withDiscount({
      final,
      merchant,
      original,
      currency,
      source: "variant",
      backendDiscount: {
        amount: variant.discountAmount,
        percentage: variant.discountPercentage,
      },
      breakdown: {
        merchantPrice: merchant,
        nubianMarkup: variant.nubianMarkup ?? 30,
        dynamicMarkup: variant.dynamicMarkup ?? 0,
        finalPrice: final,
      },
    });
  }

  // Legacy fallback: nothing was enriched, derive locally.
  return localFallback({
    merchant,
    nubianMarkup: variant.nubianMarkup ?? 30,
    dynamicMarkup: variant.dynamicMarkup ?? 0,
    legacyDiscountPrice: variant.discountPrice,
    storedFinalPrice: variant.finalPrice,
    currency,
    source: "variant",
  });
}

// ── Simple product (no variants) ─────────────────────────────────────────────
function resolveSimple(product: ProductDTO, currency = "SDG"): ResolvedPrice {
  const merchant = product.merchantPrice ?? product.basePrice ?? 0;

  if (product.finalPrice !== undefined && product.finalPrice > 0) {
    const final = product.finalPrice;
    const original = product.originalPrice ?? product.listPrice ?? final;
    return withDiscount({
      final,
      merchant,
      original,
      currency,
      source: "simple",
      backendDiscount: {
        amount: product.discountAmount,
        percentage: product.discountPercentage,
      },
    });
  }

  return localFallback({
    merchant,
    nubianMarkup: product.nubianMarkup ?? 30,
    dynamicMarkup: product.dynamicMarkup ?? 0,
    legacyDiscountPrice: product.discountPrice,
    storedFinalPrice: product.finalPrice,
    currency,
    source: "simple",
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function withDiscount(args: {
  final: number;
  merchant: number;
  original: number;
  currency: string;
  source: "simple" | "variant";
  requiresSelection?: boolean;
  backendDiscount?: { amount?: number; percentage?: number };
  breakdown?: ResolvedPrice["breakdown"];
}): ResolvedPrice {
  const { final, merchant, original, currency, source, requiresSelection, backendDiscount, breakdown } = args;

  // Prefer the backend's discount numbers; only compute when missing.
  const amount =
    backendDiscount?.amount !== undefined && backendDiscount.amount > 0
      ? backendDiscount.amount
      : Math.max(0, original - final);

  const percentage =
    backendDiscount?.percentage !== undefined && backendDiscount.percentage > 0
      ? backendDiscount.percentage
      : original > 0 && amount > 0
        ? Math.round((amount / original) * 100)
        : 0;

  return {
    final,
    merchant,
    original,
    currency,
    source,
    requiresSelection,
    discount: amount > 0 ? { amount, percentage } : undefined,
    breakdown,
  };
}

// Used only when the backend response wasn't enriched (legacy / cached).
function localFallback(args: {
  merchant: number;
  nubianMarkup: number;
  dynamicMarkup: number;
  legacyDiscountPrice?: number;
  storedFinalPrice?: number;
  currency: string;
  source: "simple" | "variant";
}): ResolvedPrice {
  const { merchant, nubianMarkup, dynamicMarkup, legacyDiscountPrice, storedFinalPrice, currency, source } = args;

  const listed = round2(merchant * (1 + nubianMarkup / 100));
  const surged = round2(merchant * (1 + nubianMarkup / 100 + dynamicMarkup / 100));
  let final = storedFinalPrice && storedFinalPrice > 0 ? storedFinalPrice : surged;

  if (legacyDiscountPrice && legacyDiscountPrice > 0 && legacyDiscountPrice < final) {
    final = legacyDiscountPrice;
  }

  const original = Math.max(listed, surged);
  const amount = Math.max(0, original - final);
  const percentage = original > 0 && amount > 0 ? Math.round((amount / original) * 100) : 0;

  return {
    final,
    merchant,
    original,
    currency,
    source,
    discount: amount > 0 ? { amount, percentage } : undefined,
    breakdown: { merchantPrice: merchant, nubianMarkup, dynamicMarkup, finalPrice: final },
  };
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
