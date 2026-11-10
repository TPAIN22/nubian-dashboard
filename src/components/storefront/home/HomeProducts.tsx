/**
 * The homepage's single product section.
 *
 * One rail, not three. The backend's `/home` feed exposes `trending`, `forYou`
 * and `brandsYouLove`, but all three are currently projections of the same
 * ranked list and arrive with identical ids in identical order — three
 * headings over the same eight products is the "same merchandising section
 * with a different title" failure, so `getHomeFeed` merges them and this
 * renders the result once. `newArrivals` and `flashDeals` are empty on the
 * live catalogue and are simply not rendered; when the backend starts filling
 * them, `HomeNewArrivals` below picks them up without a layout change.
 *
 * It replaces a grid of four hardcoded fake products — "ساعة جلدية كلاسيكية",
 * "١٢,٥٠٠ ج.س" and friends — whose images pointed at `/api/placeholder/400/500`,
 * a route this app does not serve, and which rendered as permanently
 * pulsing grey rectangles.
 */

import { ProductGrid } from "../ProductGrid";
import { Section, SectionHeading } from "../Section";
import { routes } from "@/lib/storefront/routes";
import type { StorefrontProduct } from "@/lib/storefront/types";

/** Eight is two full rows at four-up and four rows on a phone: a selection. */
const FEATURED_COUNT = 8;

export function HomeProducts({ products }: { products: StorefrontProduct[] }) {
  const featured = products.slice(0, FEATURED_COUNT);
  if (featured.length === 0) return null;

  return (
    <Section aria-labelledby="featured-heading" divided>
      <SectionHeading
        id="featured-heading"
        eyebrow="مختارات"
        title="الأكثر رواجاً الآن"
        action={{ label: "تصفّح كل المنتجات", href: routes.shop() }}
      />
      <ProductGrid products={featured} />
    </Section>
  );
}

export function HomeNewArrivals({ products }: { products: StorefrontProduct[] }) {
  const arrivals = products.slice(0, FEATURED_COUNT);
  if (arrivals.length === 0) return null;

  return (
    <Section aria-labelledby="arrivals-heading" divided>
      <SectionHeading
        id="arrivals-heading"
        eyebrow="جديد"
        title="وصل حديثاً"
        action={{ label: "تصفّح كل المنتجات", href: routes.shop() }}
      />
      <ProductGrid products={arrivals} />
    </Section>
  );
}
