/**
 * Canonical money formatting for the dashboard.
 *
 * USD is the platform's base storage currency: merchantPrice, finalPrice,
 * coupon values, commission amounts and Order.totalAmount are all persisted in
 * USD (see backend lib/pricing.engine.js, cart.controller.js, orders.model.js
 * `fxSnapshot.base`). Conversion happens only when a client sends an
 * `x-currency` header — and the dashboard deliberately never does, so every
 * amount it receives is already in dollars.
 *
 * Formatting money with any other currency code therefore does NOT convert it,
 * it just mislabels dollars. Always use these helpers rather than a local
 * Intl.NumberFormat with a hardcoded currency.
 */

export const BASE_CURRENCY = "USD";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  SDG: "ج.س",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SAR: "ر.س",
  EGP: "ج.م",
};

// Currencies whose symbol conventionally precedes the amount.
const SYMBOL_BEFORE = new Set(["USD", "EUR", "GBP"]);

export function currencySymbol(currency: string = BASE_CURRENCY): string {
  const code = String(currency || "").toUpperCase();
  return CURRENCY_SYMBOLS[code] || code || "";
}

/**
 * Format an amount for display.
 *
 * Defaults to USD because that is what the API returns. Pass an explicit
 * currency ONLY when the record carries its own — an Order, for example, stores
 * `currencyCodeSelected` alongside `finalAmountConverted`.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = BASE_CURRENCY,
): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  const code = String(currency || BASE_CURRENCY).toUpperCase();

  // Latin digits keep prices unambiguous next to Arabic UI copy, and match the
  // digits merchants type into the product wizard.
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  const symbol = currencySymbol(code);
  if (!symbol) return formatted;

  return SYMBOL_BEFORE.has(code) ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}

/** Compact form for dense tables and stat tiles: $1.2K, $3.4M. */
export function formatCurrencyCompact(
  amount: number | null | undefined,
  currency: string = BASE_CURRENCY,
): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  if (Math.abs(value) < 10_000) return formatCurrency(value, currency);

  const code = String(currency || BASE_CURRENCY).toUpperCase();
  const formatted = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  const symbol = currencySymbol(code);
  if (!symbol) return formatted;

  return SYMBOL_BEFORE.has(code) ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}
