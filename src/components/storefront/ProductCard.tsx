/**
 * Product card.
 *
 * Deliberately almost nothing: a photograph at a fixed 4:5, the category
 * and the merchant, the name, the price. No border, no shadow, no badge rail. The photography
 * is the product; chrome around it only competes.
 *
 * The whole card is one anchor, so the click target is the full tile and
 * keyboard focus lands once rather than cycling through an image link and a
 * title link that go to the same place.
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
   * Heading level for the product name. Defaults to `h3`, which is right
   * under a section's `h2` on the homepage. A listing page where the grid IS
   * the content passes 2, so the outline runs h1 -> h2 instead of skipping a
   * level straight from the page title to h3.
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
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <Link
      href={routes.product(product.id)}
      className={cn("sf-focus group block", className)}
    >
      <div className="relative">
        <StoreImage
          src={image}
          alt={product.name}
          className="aspect-[4/5] w-full rounded-[2px]"
          sizes={sizes}
          priority={priority}
          transformWidth={640}
          imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {soldOut && (
          <span className="bg-background/92 text-sf-ink absolute bottom-0 inline-block px-3 py-1.5 text-xs font-medium start-0">
            نفدت الكمية
          </span>
        )}
      </div>

      <div className="mt-4 space-y-1">
        {/* Category and seller on one quiet line. On a marketplace, who sells
            it is part of what the product is. */}
        {(product.category || product.store) && (
          <p className="sf-meta truncate">
            {product.category?.name}
            {product.category && product.store && (
              <span aria-hidden="true" className="text-sf-rule-strong mx-1.5">
                ·
              </span>
            )}
            {product.store && (
              <span>
                <span className="sr-only">يبيعه </span>
                {product.store.name}
              </span>
            )}
          </p>
        )}
        {/* Two lines maximum: a long Arabic product name must not push the
            price in one column out of line with its neighbours. */}
        <Heading className="sf-product-name line-clamp-2 group-hover:text-sf-accent transition-colors">
          {product.name}
        </Heading>
        <Price price={product.price} className="pt-1" />
      </div>
    </Link>
  );
}
