/**
 * Price display.
 *
 * The amount and the currency both come from the backend's pricing engine.
 * This component chooses glyphs and order; it never does arithmetic, and it
 * renders the struck-through original only when `hasDiscount` is true and the
 * backend supplied a genuinely higher figure.
 *
 * Digits stay Latin (`formatCurrency` uses the en-US numbering system) and
 * tabular, because prices in a column that use Eastern Arabic numerals in one
 * row and Latin in the next — which is what happens when the locale is left to
 * the browser — stop being comparable at a glance.
 */

import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { StorefrontPrice } from "@/lib/storefront/types";

interface PriceProps {
  price: StorefrontPrice | null;
  className?: string;
  /** Larger treatment for the product page. */
  size?: "default" | "lg";
}

export function Price({ price, className, size = "default" }: PriceProps) {
  if (!price) return null;

  const final = formatCurrency(price.final.amount, price.final.currency);
  const original = price.original
    ? formatCurrency(price.original.amount, price.original.currency)
    : null;

  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 gap-y-0.5",
        size === "lg" ? "sf-price text-2xl md:text-3xl" : "sf-price",
        className,
      )}
    >
      {/* `bdi` keeps the currency symbol attached to its number inside RTL
          running text instead of letting the bidi algorithm reorder them. */}
      <bdi>{final}</bdi>
      {original && (
        <bdi className="text-sf-ink-soft text-[0.85em] font-normal line-through decoration-sf-rule-strong">
          {original}
        </bdi>
      )}
      {price.discountPercentage !== undefined && (
        <span className="text-sf-accent text-[0.8em] font-semibold">
          <bdi>−{price.discountPercentage}%</bdi>
        </span>
      )}
    </p>
  );
}
