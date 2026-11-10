/**
 * Merchant storefronts.
 *
 * Nubian is a marketplace, so who is selling is part of the offer. These are
 * the approved merchants the home feed returns, each linking to its own
 * storefront. The card is a quiet logo row rather than a photographic tile —
 * see `StoreCard` for why merchant-uploaded banners are not used here.
 *
 * Six is the cap: enough to read as a community, few enough that the row
 * stays a curated selection rather than a directory.
 */

import { StoreCard } from "../StoreCard";
import { Section, SectionHeading } from "../Section";
import type { StorefrontStore } from "@/lib/storefront/types";

export function HomeStores({ stores }: { stores: StorefrontStore[] }) {
  // The card leads with the logo, so a store without one would be a branded
  // placeholder next to a name — it waits until it has a mark of its own.
  const shown = stores.filter((store) => store.logo).slice(0, 6);
  if (shown.length === 0) return null;

  return (
    <Section aria-labelledby="stores-heading" divided>
      <SectionHeading
        id="stores-heading"
        eyebrow="المتاجر"
        title=" سجــل متجــرك."
        description=" وابدأ البيع في نوبيان  ."
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((store) => (
          // `min-w-0`: a grid item defaults to `min-width: auto`, so without
          // it the longest store name ("متجر المناهل - Mnahel Store") sets the
          // track width instead of truncating, and the row runs 9px past a
          // 320px viewport.
          <li key={store.id} className="min-w-0">
            <StoreCard store={store} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
