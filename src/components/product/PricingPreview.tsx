"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { formatCurrency } from "@/lib/currency";
import { DEFAULT_NUBIAN_MARKUP } from "@/lib/pricing.config";
import type { ProductDiscountDTO } from "@/domain/product/product.types";

// ===========================================================================
// PRICING ENGINE MIRROR
// ===========================================================================
// SOURCE OF TRUTH: apps/backend/src/lib/pricing.engine.js
//   - isProductDiscountActive        → lines 32–40
//   - computeProductDiscountAmount   → lines 46–55
//   - calculateFinalPrice            → lines 61–128
//
// This is a deliberate, line-for-line mirror so an admin previews the SAME
// number the shopper is charged. It exists only because the wizard has to show
// a price BEFORE the product is saved and the backend can answer. The moment a
// server-computed `finalPrice` is available it wins (see the `finalPrice` prop).
//
// If you change the engine, change this too — and keep the order of operations
// identical, especially:
//   * the cost floor applies ONLY when no human-set discount exists (engine:100)
//   * originalPrice = max(listed, surged)                          (engine:106)
// ===========================================================================

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

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

// ===========================================================================

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
