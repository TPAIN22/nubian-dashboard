"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { FormVariant, getMinVariantPrice, getResolvedVariantPrice } from "@/lib/products/normalizeProductPayload";

interface VariantPricingPreviewProps {
  variants: FormVariant[];
  defaultVariantMerchantPrice?: number | "";
  defaultNubianMarkup?: number;
}

export function VariantPricingPreview({
  variants,
  defaultVariantMerchantPrice,
  defaultNubianMarkup = 10,
}: VariantPricingPreviewProps) {
  // Calculate min price across all variants
  const minFinalPrice = React.useMemo(() => {
    return getMinVariantPrice(variants, defaultVariantMerchantPrice, defaultNubianMarkup);
  }, [variants, defaultVariantMerchantPrice, defaultNubianMarkup]);

  // Calculate max price
  const maxFinalPrice = React.useMemo(() => {
    if (variants.length === 0) return 0;
    
    let maxPrice = 0;
    
    for (const variant of variants) {
      const { price } = getResolvedVariantPrice(variant, defaultVariantMerchantPrice);
      if (price !== undefined && price > 0) {
        const finalPrice = price * (1 + (variant.nubianMarkup ?? defaultNubianMarkup) / 100);
        if (finalPrice > maxPrice) {
          maxPrice = finalPrice;
        }
      }
    }
    
    return maxPrice;
  }, [variants, defaultVariantMerchantPrice, defaultNubianMarkup]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SDG",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (variants.length === 0) {
    return null;
  }

  const hasValidPrices = minFinalPrice > 0;
  const hasPriceRange = minFinalPrice !== maxFinalPrice && maxFinalPrice > 0;

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
