"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PricingPreviewProps {
  merchantPrice?: number;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  finalPrice?: number;
  isMerchantView?: boolean;
}

export function PricingPreview({
  merchantPrice = 0,
  nubianMarkup = 10,
  dynamicMarkup = 0,
  finalPrice,
  isMerchantView = false,
}: PricingPreviewProps) {
  // Calculate final price if not provided
  const calculatedFinalPrice = React.useMemo(() => {
    if (finalPrice !== undefined && finalPrice > 0) {
      return finalPrice;
    }
    if (merchantPrice > 0) {
      const nubianMarkupAmount = (merchantPrice * nubianMarkup) / 100;
      const dynamicMarkupAmount = (merchantPrice * dynamicMarkup) / 100;
      return Math.max(merchantPrice, merchantPrice + nubianMarkupAmount + dynamicMarkupAmount);
    }
    return 0;
  }, [merchantPrice, nubianMarkup, dynamicMarkup, finalPrice]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SDG",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate markup percentage
  const totalMarkupPercentage = nubianMarkup + dynamicMarkup;
  const markupAmount = calculatedFinalPrice - merchantPrice;

  // Validation checks
  const isValid = merchantPrice > 0 && calculatedFinalPrice >= merchantPrice;
  const exceedsThreshold = isMerchantView && merchantPrice > 0 && totalMarkupPercentage > 50;
  const belowMinimum = calculatedFinalPrice < merchantPrice;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">معاينة التسعير</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">سعر التاجر:</span>
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
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold text-primary">السعر النهائي:</span>
            <span className="font-bold text-lg text-primary">
              {calculatedFinalPrice > 0 ? formatCurrency(calculatedFinalPrice) : "—"}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {!isValid && merchantPrice === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              يرجى إدخال سعر التاجر لرؤية معاينة التسعير
            </AlertDescription>
          </Alert>
        )}

        {belowMinimum && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              السعر النهائي لا يمكن أن يكون أقل من سعر التاجر
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

        {isMerchantView && !exceedsThreshold && isValid && (
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
