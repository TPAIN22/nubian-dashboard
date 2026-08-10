"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axiosInstance";

/**
 * Currencies a merchant may ENTER a price in.
 *
 * Deliberately NOT the same list as the shopper-facing currency picker. Viewing
 * a price tolerates a missing FX rate — the backend falls back to showing
 * dollars. Entering one does not: with no rate there is nothing to convert the
 * typed amount into, and a 1:1 guess would store 60,000 SDG as $60,000. The
 * backend intersects "active" with "has a usable rate" and returns only what is
 * safe to type in (services/currency.service.js → listInputEligibleCurrencies).
 *
 * The `rate` comes back with the list so the wizard can show the merchant the
 * conversion BEFORE they commit to it. Do not use it to convert client-side and
 * submit dollars — the backend re-resolves the rate at write time and that is
 * the one that gets stored. This is for display only.
 */
export interface InputCurrency {
  code: string;
  name: string;
  nameAr?: string;
  symbol: string;
  symbolPosition: "before" | "after";
  decimals: number;
  /** USD → this currency. Divide to go the other way. */
  rate: number;
  rateDate: string | null;
  rateProvider: string | null;
  /** Whole days since rateDate; null when unknown. */
  rateAgeDays: number | null;
}

export const USD_FALLBACK: InputCurrency = {
  code: "USD",
  name: "US Dollar",
  nameAr: "دولار أمريكي",
  symbol: "$",
  symbolPosition: "before",
  decimals: 2,
  rate: 1,
  rateDate: null,
  rateProvider: "system",
  rateAgeDays: 0,
};

export function useInputCurrencies() {
  const query = useQuery<InputCurrency[]>({
    queryKey: ["input-currencies"],
    // Rates move at most daily and a stale one here only affects the preview
    // (the backend re-resolves on save), so this does not need to be fresh.
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      const res = await axiosInstance.get("/meta/input-currencies");
      const list = res.data?.data ?? res.data ?? [];
      return Array.isArray(list) ? list : [];
    },
  });

  // Never leave the picker empty: if the endpoint is unreachable the merchant
  // can still price in dollars, which is what every product did before this
  // feature existed.
  const currencies = query.data?.length ? query.data : [USD_FALLBACK];

  return { ...query, currencies };
}

/** Look a currency up by code, falling back to USD. */
export function findCurrency(currencies: InputCurrency[], code: string): InputCurrency {
  return currencies.find((c) => c.code === code) ?? USD_FALLBACK;
}

/**
 * The USD a typed amount represents. Mirrors the backend's `usdFromRate`
 * (services/currency.service.js) — FX rate only, no market markup, no
 * psychological rounding. PREVIEW ONLY; the stored value is the backend's.
 */
export function previewUsd(amount: number, currency: InputCurrency): number {
  if (!(currency.rate > 0)) return 0;
  return Math.round(((Number(amount) || 0) / currency.rate + Number.EPSILON) * 100) / 100;
}

/** Format a typed amount in the merchant's own currency. */
export function formatInput(amount: number, currency: InputCurrency): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(value);

  return currency.symbolPosition === "after"
    ? `${formatted} ${currency.symbol}`
    : `${currency.symbol}${formatted}`;
}
