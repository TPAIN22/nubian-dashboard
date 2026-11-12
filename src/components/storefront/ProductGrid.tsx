/**
 * Product grid.
 *
 * Two columns on a phone rather than one: a single-column catalogue on a
 * narrow screen turns browsing into scrolling, and the 4:5 card is legible at
 * half a phone width. Density steps up to four columns and stops there —
 * five-up shrinks the photography past the point where it sells anything.
 */

import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";
import type { StorefrontProduct } from "@/lib/storefront/types";

interface ProductGridProps {
  products: StorefrontProduct[];
  /** Number of leading cards to mark as priority (above-the-fold rows only). */
  priorityCount?: number;
  className?: string;
  /** See `ProductCard` — 2 on listing pages, 3 under a homepage section. */
  headingLevel?: 2 | 3;
}

const SIZES =
  "(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 46vw";

export function ProductGrid({
  products,
  priorityCount = 0,
  className,
  headingLevel = 3,
}: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14",
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            priority={index < priorityCount}
            sizes={SIZES}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </ul>
  );
}
