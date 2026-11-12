/**
 * Merchant store card.
 *
 * Two decisions worth stating, because both are deliberate omissions.
 *
 * **No banner.** The first version of this card led with `store.banner`, which
 * is the artwork merchants upload for themselves. In the live data that is a
 * logo screenshot with a transparency checkerboard baked in, a blurry photo,
 * and a saturated yellow sale flyer — sitting in a row directly under a grid
 * of art-directed product photography. The brief's requirement for consistent
 * crops and quality cannot be met by images nobody art-directs, so the card
 * uses the logo in a fixed square well instead: one shape, one treatment,
 * `object-contain` so a wordmark is never cropped.
 *
 * **No rating, no verified badge.** `getStoreHighlights` returns
 * `rating: 4.5, verified: true` for every approved merchant — those are
 * hardcoded defaults, and the live stores report `totalReviews: 0`. Printing
 * them would manufacture exactly the trust signal this redesign exists to
 * remove. Name and city are real; that is what the card shows.
 */

import Link from "next/link";

import { StoreImage } from "./StoreImage";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/storefront/routes";
import type { StorefrontStore } from "@/lib/storefront/types";

interface StoreCardProps {
  store: StorefrontStore;
  className?: string;
}

export function StoreCard({ store, className }: StoreCardProps) {
  return (
    <Link
      href={routes.store(store.id)}
      className={cn(
        "sf-focus group bg-sf-well hover:bg-sf-sand flex items-center gap-4 rounded-[2px] p-4 transition-colors md:gap-5 md:p-5",
        className,
      )}
    >
      <StoreImage
        src={store.logo}
        alt=""
        className="size-16 shrink-0 md:size-[72px]"
        sizes="72px"
        transformWidth={160}
        fit="contain"
      />

      <div className="min-w-0 flex-1">
        <h3 className="sf-product-name group-hover:text-sf-accent truncate text-base transition-colors">
          {store.name}
        </h3>
        {store.city && <p className="sf-meta mt-1 truncate">{store.city}</p>}
      </div>

      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="text-sf-rule-strong group-hover:text-sf-accent h-4 w-4 shrink-0 transition-colors rtl:rotate-180"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 3l5 5-5 5" />
      </svg>
    </Link>
  );
}
