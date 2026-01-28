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
 * Authoritative pricing resolver for the shop (Ported from Nubian/domain/pricing/pricing.engine.ts).
 */
export function resolvePrice({
  product,
  selectedVariant,
  currency = "SDG",
}: PricingOptions): ResolvedPrice {
  if (!product) {
      return {
          final: 0,
          merchant: 0,
          original: 0,
          currency,
          source: "simple",
      }
  }

  // Safe access
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  
  // Case 1: Variant Product
  if (hasVariants) {
    if (!selectedVariant) {
      // Get "From" price from product (if backend computed it) or min variant price
      let minPrice = product.finalPrice || 0;
      let minMerchant = product.merchantPrice || 0;

      // If top-level is 0, find min from variants
      if (minPrice === 0 && variants.length > 0) {
          const variantPrices = variants.map(v => calculateVariantPrice(v));
           // Filter out 0s unless all are 0
          const validPrices = variantPrices.filter(p => p.final > 0);
          if (validPrices.length > 0) {
              const minP = validPrices.sort((a,b) => a.final - b.final)[0];
              minPrice = minP.final;
              minMerchant = minP.merchant;
          }
      }

      return {
        final: minPrice,
        merchant: minMerchant,
        original: minMerchant, // Display "From X" usually shows X
        currency,
        requiresSelection: true,
        source: "variant",
      };
    }

    // Selected variant exists
    return calculateVariantPrice(selectedVariant, currency);
  }

  // Case 2: Simple Product (No variants)
  return calculateSimplePrice(product, currency);
}

function calculateVariantPrice(variant: ProductVariantDTO, currency = "SDG"): ResolvedPrice {
    const final = variant.finalPrice ?? variant.price ?? 0;
    const merchant = variant.merchantPrice ?? 0;
    const nubianMarkup = variant.nubianMarkup ?? 10; // Default 10% if missing

    // If final price is 0, calculate it!
    let calculatedFinal = final;
    if (calculatedFinal <= 0 && merchant > 0) {
        calculatedFinal = merchant * (1 + nubianMarkup / 100);
    }

    // The "normal" price is the merchant price plus the fixed Nubian markup
    const normalPrice = merchant * (1 + nubianMarkup / 100);
    
    let original = normalPrice;
    
    if (variant.discountPrice && variant.discountPrice > 0) {
      original = variant.finalPrice || normalPrice;
      calculatedFinal = variant.discountPrice; // Use discount price as final
    } else if (normalPrice > calculatedFinal) {
      original = normalPrice;
    } else {
      original = calculatedFinal;
    }

    const discountAmount = Math.max(0, original - calculatedFinal);
    const discountPercentage = original > 0 ? Math.round((discountAmount / original) * 100) : 0;

    return {
      final: calculatedFinal,
      merchant,
      original,
      currency,
      requiresSelection: false,
      source: "variant",
      discount: discountAmount > 0 ? { amount: discountAmount, percentage: discountPercentage } : undefined,
      breakdown: {
        merchantPrice: merchant,
        nubianMarkup,
        dynamicMarkup: variant.dynamicMarkup ?? 0,
        finalPrice: calculatedFinal,
      },
    };
}

function calculateSimplePrice(product: ProductDTO, currency = "SDG"): ResolvedPrice {
    const final = product.finalPrice ?? product.price ?? 0;
    const merchant = product.merchantPrice ?? 0;
    const nubianMarkup = product.nubianMarkup ?? 10; // Default 10%

    // If final price is 0, calculate it!
    let calculatedFinal = final;
    if (calculatedFinal <= 0 && merchant > 0) {
        calculatedFinal = merchant * (1 + nubianMarkup / 100);
    }
    
    const normalPrice = merchant * (1 + nubianMarkup / 100);
    
    let original = normalPrice;
    
    if (product.discountPrice && product.discountPrice > 0) {
      original = product.finalPrice || normalPrice;
      calculatedFinal = product.discountPrice;
    } else if (normalPrice > calculatedFinal) {
      original = normalPrice;
    } else {
      original = calculatedFinal;
    }

    const discountAmount = Math.max(0, original - calculatedFinal);
    const discountPercentage = original > 0 ? Math.round((discountAmount / original) * 100) : 0;

    return {
      final: calculatedFinal,
      merchant,
      original,
      currency,
      requiresSelection: false,
      source: "simple",
      discount: discountAmount > 0 ? { amount: discountAmount, percentage: discountPercentage } : undefined,
    };
}
