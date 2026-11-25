/**
 * Product card.
 *
 * A rounded photo well at a fixed 4:5, then the seller, the name and the
 * price. Two badges, both driven by backend data only: the discount the
 * pricing engine returned, and "sold out" when stock is zero.
 *
 * The whole card is one anchor, so the click target is the full tile and
 * keyboard focus lands once.
 */

import Link from "next/link";

import { StoreImage } from "./StoreImage";
import { Price } from "./Price";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/storefront/routes";
import { primaryImage } from "@/lib/storefront/image";
import type { StorefrontProduct } from "@/lib/storefront/types";

interface ProductCardProps {
  product: StorefrontProduct;
  /** Only the first row above the fold should set this. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  /**
   * Heading level for the product name. `h3` under a homepage section's `h2`;
   * listing pages where the grid IS the content pass 2.
   */
  headingLevel?: 2 | 3;
}

const DEFAULT_SIZES =
  "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

export function ProductCard({
  product,
  priority = false,
  sizes = DEFAULT_SIZES,
  className,
  headingLevel = 3,
}: ProductCardProps) {
  const image = primaryImage(product.images);
  const soldOut = product.stock !== null && product.stock <= 0;
  const discount = product.price?.discountPercentage;
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <Link href={routes.product(product.id)} className={cn("sf-focus group block", className)}>
      <div className="relative">
        <StoreImage
          src={image}
          alt={product.name}
          className="aspect-[4/5] w-full rounded-2xl"
          sizes={sizes}
          priority={priority}
          transformWidth={640}
          imageClassName={cn(
            "transition-transform duration-500 ease-out group-hover:scale-[1.04]",
            soldOut && "opacity-60",
          )}
        />

        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          {discount !== undefined && !soldOut ? (
            <span className="bg-sf-sale rounded-full px-2.5 py-1 text-[0.75rem] leading-none font-bold text-white">
              <bdi>−{discount}%</bdi>
            </span>
          ) : (
            <span />
          )}
          {soldOut && (
            <span className="bg-background/95 text-sf-ink rounded-full px-2.5 py-1 text-[0.75rem] leading-none font-semibold shadow-sm">
              نفدت الكمية
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1 px-0.5">
        {product.store && (
          <p className="sf-meta truncate">
            <span className="sr-only">يبيعه </span>
            {product.store.name}
          </p>
        )}
        {/* Two lines maximum, so prices in a row stay aligned. */}
        <Heading className="sf-product-name line-clamp-2 min-h-[3.1em] transition-colors group-hover:text-sf-accent">
          {product.name}
        </Heading>
        <Price price={product.price} hideDiscount className="pt-0.5" />
      </div>
    </Link>
  );
}
