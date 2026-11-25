/**
 * Approved stores.
 *
 * Stores appear in the home feed only once their `merchantStatus` is
 * `approved`, so the claim in the description is true by construction. Cards
 * lead with the logo (see `StoreCard` for why banners and the backend's
 * placeholder ratings are not used). Six is the cap: a selection, not a
 * directory. Returns null when no store has a logo yet.
 */

import { StoreCard } from "../StoreCard";
import { Section, SectionHeading } from "../Section";
import type { StorefrontStore } from "@/lib/storefront/types";

export function HomeStores({ stores }: { stores: StorefrontStore[] }) {
  const shown = stores.filter((store) => store.logo).slice(0, 6);
  if (shown.length === 0) return null;

  return (
    <Section aria-labelledby="stores-heading">
      <SectionHeading
        id="stores-heading"
        eyebrow="المتاجر"
        title="متاجر معتمدة"
        description="لا يظهر متجر على نوبيان قبل أن يوافق فريقنا على طلبه."
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {shown.map((store) => (
          // `min-w-0` lets long store names truncate instead of widening the track.
          <li key={store.id} className="min-w-0">
            <StoreCard store={store} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
