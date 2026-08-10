"use client";

import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import {
  findCurrency,
  formatInput,
  previewUsd,
  useInputCurrencies,
  type InputCurrency,
} from "@/hooks/useInputCurrencies";

/**
 * A feed rate older than this is worth mentioning. Applied ONLY to feed rates:
 * a manual rate's date is just when an admin last edited it, and for a pegged
 * currency like SAR that is legitimately months ago. Warning about those would
 * train merchants to ignore the warning.
 */
const STALE_FEED_DAYS = 3;

export function PricingCurrencyPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const { currencies, isLoading } = useInputCurrencies();
  const selected = findCurrency(currencies, value);
  const isForeign = selected.code !== "USD";

  const staleFeed =
    isForeign &&
    selected.rateProvider === "frankfurter" &&
    (selected.rateAgeDays ?? 0) > STALE_FEED_DAYS;

  return (
    <div className="space-y-2">
      <Label className="font-bold">عملة إدخال الأسعار</Label>

      <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.nameAr || c.name} ({c.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground">
        أدخل كل الأسعار بهذه العملة. تُحوَّل إلى الدولار الأمريكي عند الحفظ.
      </p>

      {isForeign && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-muted-foreground">
            1 USD = {selected.rate} {selected.code}
          </span>
        
          {selected.rateDate ? (
            <span className="text-muted-foreground opacity-70">{selected.rateDate}</span>
          ) : null}
        </div>
      )}

      {staleFeed && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            سعر الصرف عمره {selected.rateAgeDays} يوماً. سيُستخدم أحدث سعر متاح لحظة الحفظ،
            وقد يختلف عن المعاينة أدناه.
          </AlertDescription>
        </Alert>
      )}

      {isForeign && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            المعاينة تقديرية. السعر المحفوظ يُحسب بسعر الصرف لحظة الحفظ على الخادم.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * "≈ $100.00" — the dollars a typed amount currently represents.
 *
 * The single most important element of this feature: it makes the form's
 * interpretation of the number visible while the merchant types, which is a
 * better safeguard against a mis-picked currency than locking the picker (which
 * would trap anyone who picked wrong first).
 *
 * Renders nothing for USD — there is no conversion to show.
 */
export function ConvertedHint({
  amount,
  currencyCode,
  className = "",
}: {
  amount: number;
  currencyCode: string;
  className?: string;
}) {
  const { currencies } = useInputCurrencies();
  const currency = findCurrency(currencies, currencyCode);

  if (currency.code === "USD" || !(Number(amount) > 0)) return null;

  return (
    <p className={`text-[11px] text-muted-foreground ${className}`}>
      {formatInput(Number(amount), currency)}{" "}
      <span className="opacity-60">≈</span>{" "}
      <span className="font-mono font-medium">
        {formatCurrency(previewUsd(Number(amount), currency))}
      </span>
    </p>
  );
}

export type { InputCurrency };
