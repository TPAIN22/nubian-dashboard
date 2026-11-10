/**
 * The shelf — where the campaign hands over to the catalogue.
 *
 * The version this replaces opened on one "hero" product blown up to half the
 * screen: the top-ranked item in the live feed, at 4:4.4 and 1100px. Which
 * product ranks first is not an art-direction decision, and in the live feed
 * it is a handheld phone snapshot taken in a shop — enlarged to campaign
 * scale directly under three graded campaign frames. The handover read as the
 * brand stepping down a level, which is exactly what a handover must not do.
 *
 * So no product is promoted to campaign scale. The shelf shows the feed at one
 * honest size, in a uniform grid, under the same headline voice as the frames
 * above it; the continuity comes from type, ground and rhythm rather than from
 * pretending one merchant photo is a campaign still. Nothing about price,
 * discount or availability is recomputed here — `ProductCard` renders what the
 * backend's pricing engine returned.
 *
 * The heading copy is always shown; only the grid depends on the feed, so an
 * empty feed leaves a way into the shop rather than a hole.
 */

import { ProductGrid } from "../ProductGrid";
import { Container } from "../Section";
import { StoreButton } from "../StoreButton";
import { routes } from "@/lib/storefront/routes";
import type { StorefrontProduct } from "@/lib/storefront/types";

/** Two full rows at four-up, four rows on a phone. */
const SHELF_COUNT = 8;

export function StoryProductShowcase({
  products,
}: {
  products: StorefrontProduct[];
}) {
  const shelf = products.slice(0, SHELF_COUNT);

  return (
    <section aria-labelledby="shelf-heading" className="bg-background">
      <Container className="pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mb-12 grid gap-6 md:mb-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="max-w-2xl">
            <p className="sf-eyebrow mb-4">رائج الآن</p>
            <h2 id="shelf-heading" className="sf-title text-sf-ink">
              على الرفوف الآن.
            </h2>
            <p className="sf-body mt-4 max-w-lg">
              منتجات معروضة الآن على نوبيان، بأسعارها اليوم بالجنيه السوداني.
            </p>
          </div>
          <StoreButton href={routes.shop()} variant="outline" className="justify-self-start md:justify-self-end">
            كل المنتجات
          </StoreButton>
        </div>

        {shelf.length > 0 && <ProductGrid products={shelf} priorityCount={0} />}
      </Container>
    </section>
  );
}
