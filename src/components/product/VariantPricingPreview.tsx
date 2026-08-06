"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle } from "lucide-react";
import { FormVariant, getResolvedVariantPrice } from "@/lib/products/normalizeProductPayload";

import { formatCurrency } from "@/lib/currency";
import { DEFAULT_NUBIAN_MARKUP } from "@/lib/pricing.config";
import type { ProductDiscountDTO } from "@/domain/product/product.types";
// The one shared engine. SOURCE OF TRUTH is
// apps/backend/src/lib/pricing.engine.js — see the header comment there.
import { computeEnginePricing, discountInactiveReason } from "@/domain/pricing/pricing.engine";

/**
 * `FormVariant` (lib/products/normalizeProductPayload.ts) predates the discount
 * work and has no `merchantDiscount`. Widen it here rather than weakening the
 * shared type.
 */
export type FormVariantWithDiscount = FormVariant & { merchantDiscount?: number };

interface VariantPricingPreviewProps {
  variants: FormVariantWithDiscount[];
  defaultVariantMerchantPrice?: number | "";
  defaultNubianMarkup?: number;
  /** Product-level discount block — applies to EVERY variant. */
  discount?: ProductDiscountDTO | null;
}

export function VariantPricingPreview({
  variants,
  defaultVariantMerchantPrice,
  defaultNubianMarkup = DEFAULT_NUBIAN_MARKUP,
  discount = null,
}: VariantPricingPreviewProps) {
  // Run the engine mirror over every priced variant once, then derive
  // everything from that — the previous version computed
  // `price * (1 + markup)` inline and so ignored both discount mechanisms.
  const priced = React.useMemo(() => {
    const out: { final: number; original: number; overDiscounted: boolean }[] = [];
    for (const variant of variants) {
      const { price } = getResolvedVariantPrice(variant, defaultVariantMerchantPrice);
      if (price === undefined || price <= 0) continue;

      const merchantDiscount = Number(variant.merchantDiscount) || 0;
      const result = computeEnginePricing({
        merchantPrice: price,
        nubianMarkup: variant.nubianMarkup ?? defaultNubianMarkup,
        merchantDiscount,
        discount,
      });
      out.push({
        final: result.finalPrice,
        original: result.originalPrice,
        // A per-variant discount larger than the marked-up price is almost
        // always a percentage typed into an absolute-amount field.
        overDiscounted: merchantDiscount > result.listPrice,
      });
    }
    return out;
  }, [variants, defaultVariantMerchantPrice, defaultNubianMarkup, discount]);

  const minFinalPrice = priced.length ? Math.min(...priced.map((p) => p.final)) : 0;
  const maxFinalPrice = priced.length ? Math.max(...priced.map((p) => p.final)) : 0;
  const minOriginalPrice = priced.length ? Math.min(...priced.map((p) => p.original)) : 0;
  const overDiscountedCount = priced.filter((p) => p.overDiscounted).length;

  // Count variants by price source
  const priceCounts = React.useMemo(() => {
    let custom = 0;
    let usingDefault = 0;
    let missing = 0;

    for (const variant of variants) {
      const { source } = getResolvedVariantPrice(variant, defaultVariantMerchantPrice);
      if (source === "custom") custom++;
      else if (source === "default") usingDefault++;
      else missing++;
    }

    return { custom, usingDefault, missing };
  }, [variants, defaultVariantMerchantPrice]);

  const inactiveReason = discount?.isActive ? discountInactiveReason(discount) : null;

  if (variants.length === 0) {
    return null;
  }

  const hasValidPrices = minFinalPrice > 0;
  const hasPriceRange = minFinalPrice !== maxFinalPrice && maxFinalPrice > 0;
  // The "from" price is what a shopper sees on a listing, so the strikethrough
  // must be the same variant's original — hence min-of-originals, not max.
  const showStrikethrough = hasValidPrices && minOriginalPrice > minFinalPrice;
  const headlineDiscountPct = showStrikethrough
    ? Math.round(((minOriginalPrice - minFinalPrice) / minOriginalPrice) * 100)
    : 0;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="w-4 h-4" />
          معاينة أسعار المتغيرات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price range display */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">نطاق السعر النهائي:</span>
          <span className="flex items-baseline gap-2">
            {showStrikethrough && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(minOriginalPrice)}
              </span>
            )}
            <span className="font-bold text-lg text-primary">
              {hasValidPrices ? (
                hasPriceRange ? (
                  <>
                    {formatCurrency(minFinalPrice)} - {formatCurrency(maxFinalPrice)}
                  </>
                ) : (
                  formatCurrency(minFinalPrice)
                )
              ) : (
                "—"
              )}
            </span>
            {showStrikethrough && (
              <Badge variant="destructive" className="text-[10px]">
                −{headlineDiscountPct}%
              </Badge>
            )}
          </span>
        </div>

        {/* Price source breakdown */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">توزيع الأسعار:</span>
          <div className="flex flex-wrap gap-2">
            {priceCounts.custom > 0 && (
              <Badge variant="secondary" className="text-xs">
                {priceCounts.custom} بسعر مخصص
              </Badge>
            )}
            {priceCounts.usingDefault > 0 && (
              <Badge variant="outline" className="text-xs">
                {priceCounts.usingDefault} بالسعر الافتراضي
              </Badge>
            )}
            {priceCounts.missing > 0 && (
              <Badge variant="destructive" className="text-xs">
                {priceCounts.missing} بدون سعر
              </Badge>
            )}
          </div>
        </div>

        {inactiveReason && (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
            {inactiveReason === "expired" && "خصم المنتج مُفعَّل لكنه منتهي — لن يُطبَّق على أي متغير."}
            {inactiveReason === "not-started" && "خصم المنتج مُفعَّل لكنه لم يبدأ بعد — لن يُطبَّق حالياً."}
            {inactiveReason === "no-value" && "خصم المنتج مُفعَّل لكن قيمته صفر — لن يُطبَّق."}
            {inactiveReason === "no-type" && "خصم المنتج مُفعَّل لكن نوعه غير محدد — لن يُطبَّق."}
          </p>
        )}

        {overDiscountedCount > 0 && (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
            {overDiscountedCount} متغير خصمه أكبر من سعر البيع — تذكّر أن خصم التاجر مبلغ ثابت وليس نسبة مئوية.
          </p>
        )}

        {/* Tip for users */}
        {hasValidPrices && (
          <p className="text-xs text-muted-foreground">
            سيظهر للمتسوقين: &quot;ابتداءً من {formatCurrency(minFinalPrice)}&quot;
          </p>
        )}

        {!hasValidPrices && (
          <p className="text-xs text-destructive">
            يرجى تعيين أسعار للمتغيرات أو سعر افتراضي
          </p>
        )}
      </CardContent>
    </Card>
  );
}
