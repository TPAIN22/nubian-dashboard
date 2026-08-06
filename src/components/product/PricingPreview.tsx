"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { formatCurrency } from "@/lib/currency";
import { DEFAULT_NUBIAN_MARKUP } from "@/lib/pricing.config";
import type { ProductDiscountDTO } from "@/domain/product/product.types";
// The pricing math lives in the domain layer, NOT in this component. Every
// consumer (VariantPricingPreview, ProductWizard, lib/pricing.ts) imports it
// from the same module, so there is one implementation to keep in step with
// apps/backend/src/lib/pricing.engine.js.
import {
  computeEnginePricing,
  discountInactiveReason,
  round2,
} from "@/domain/pricing/pricing.engine";

interface PricingPreviewProps {
  merchantPrice?: number;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  /** Per-variant absolute amount off — not a percentage. */
  merchantDiscount?: number;
  /** Product-level discount block, applied to every variant. */
  discount?: ProductDiscountDTO | null;
  /** Server-computed final price. When present (> 0) it overrides the mirror. */
  finalPrice?: number;
  isMerchantView?: boolean;
}

export function PricingPreview({
  merchantPrice = 0,
  nubianMarkup = DEFAULT_NUBIAN_MARKUP,
  dynamicMarkup = 0,
  merchantDiscount = 0,
  discount = null,
  finalPrice,
  isMerchantView = false,
}: PricingPreviewProps) {
  const pricing = React.useMemo(
    () =>
      computeEnginePricing({
        merchantPrice,
        nubianMarkup,
        dynamicMarkup,
        merchantDiscount,
        discount,
      }),
    [merchantPrice, nubianMarkup, dynamicMarkup, merchantDiscount, discount],
  );

  // The backend's number always wins when we have it.
  const calculatedFinalPrice =
    finalPrice !== undefined && finalPrice > 0 ? finalPrice : pricing.finalPrice;

  const originalPrice = Math.max(pricing.originalPrice, calculatedFinalPrice);
  const discountAmount =
    originalPrice > calculatedFinalPrice ? round2(originalPrice - calculatedFinalPrice) : 0;
  const discountPercentage =
    originalPrice > 0 && discountAmount > 0
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0;
  const hasDiscount = discountAmount > 0;

  const totalMarkupPercentage = nubianMarkup + dynamicMarkup;

  // A discount the admin switched on that the engine will nonetheless ignore —
  // almost always a date window that has expired or not opened yet.
  const inactiveReason = React.useMemo(
    () => (discount?.isActive ? discountInactiveReason(discount) : null),
    [discount],
  );

  const isValid = merchantPrice > 0 && calculatedFinalPrice > 0;
  const exceedsThreshold = isMerchantView && merchantPrice > 0 && totalMarkupPercentage > 50;
  // Below cost is legitimate ONLY because a human asked for it (engine line 100).
  const belowCost = merchantPrice > 0 && calculatedFinalPrice < merchantPrice;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">معاينة التسعير</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">سعر التاجر (التكلفة):</span>
            <span className="font-medium">
              {merchantPrice > 0 ? formatCurrency(merchantPrice) : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">هامش نوبيان:</span>
            <span className="font-medium">{nubianMarkup}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">هامش ديناميكي:</span>
            <span className="font-medium">{dynamicMarkup}%</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">إجمالي الهامش:</span>
            <Badge variant="outline">{totalMarkupPercentage.toFixed(1)}%</Badge>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">السعر قبل الخصم:</span>
            <span className="font-medium">
              {originalPrice > 0 ? formatCurrency(originalPrice) : "—"}
            </span>
          </div>

          {pricing.breakdown.variantDiscount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">خصم التاجر (مبلغ ثابت):</span>
              <span className="font-medium text-destructive">
                − {formatCurrency(pricing.breakdown.variantDiscount)}
              </span>
            </div>
          )}

          {pricing.breakdown.productDiscount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                خصم المنتج
                {discount?.type === "percentage" ? ` (${discount.value}%)` : ""}:
              </span>
              <span className="font-medium text-destructive">
                − {formatCurrency(pricing.breakdown.productDiscount)}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t items-baseline">
            <span className="font-semibold text-primary">السعر النهائي للعميل:</span>
            <span className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              <span className="font-bold text-lg text-primary">
                {calculatedFinalPrice > 0 ? formatCurrency(calculatedFinalPrice) : "—"}
              </span>
              {hasDiscount && (
                <Badge variant="destructive" className="text-[10px]">
                  −{discountPercentage}%
                </Badge>
              )}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {merchantPrice === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              يرجى إدخال سعر التاجر لرؤية معاينة التسعير
            </AlertDescription>
          </Alert>
        )}

        {/* The state the backend treats specially: switched on, but the engine
            will not apply it. */}
        {inactiveReason && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {inactiveReason === "expired" &&
                "الخصم مُفعَّل لكنه منتهي الصلاحية — لن يُطبَّق على العميل. عدّل تاريخ الانتهاء أو أزِله."}
              {inactiveReason === "not-started" &&
                "الخصم مُفعَّل لكنه لم يبدأ بعد — لن يُطبَّق حتى يحين تاريخ البدء."}
              {inactiveReason === "no-value" &&
                "الخصم مُفعَّل لكن قيمته صفر — لن يُطبَّق. أدخل قيمة أكبر من صفر."}
              {inactiveReason === "no-type" &&
                "الخصم مُفعَّل لكن نوعه غير محدد — لن يُطبَّق. اختر نسبة مئوية أو مبلغاً ثابتاً."}
            </AlertDescription>
          </Alert>
        )}

        {belowCost && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              السعر النهائي ({formatCurrency(calculatedFinalPrice)}) أقل من سعر التاجر
              ({formatCurrency(merchantPrice)}) — ستبيع بخسارة.
            </AlertDescription>
          </Alert>
        )}

        {isMerchantView && exceedsThreshold && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              تحذير: السعر النهائي يتجاوز سعر التاجر بأكثر من 50% ({totalMarkupPercentage.toFixed(1)}%)
            </AlertDescription>
          </Alert>
        )}

        {isMerchantView && !exceedsThreshold && isValid && !belowCost && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              السعر النهائي: {formatCurrency(calculatedFinalPrice)} (هامش {totalMarkupPercentage.toFixed(1)}%)
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
