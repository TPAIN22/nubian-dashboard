/**
 * Shop by department.
 *
 * Square photo tiles with the name underneath: a swipeable rail on a phone,
 * a six-up grid from `lg`. It is also the target of the hero's
 * "تصفّح الأقسام" link.
 *
 * `visibleCategories` decides the list (drops imageless rows and duplicate
 * names, ranks by merchandising order). The section returns null if nothing
 * survives, so an outage removes the band instead of titling a void.
 */

import { CategoryTile, visibleCategories } from "../CategoryTile";
import { Section, SectionHeading } from "../Section";
import { routes } from "@/lib/storefront/routes";
import type { StorefrontCategory } from "@/lib/storefront/types";

/**
 * Desktop shows one balanced row: up to eight tiles, never an orphaned second
 * row. Anything past the column count stays reachable in the phone rail and
 * through "كل المنتجات". Static class names so Tailwind generates them.
 */
const LG_COLS: Record<number, string> = {
  1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4",
  5: "lg:grid-cols-5", 6: "lg:grid-cols-6", 7: "lg:grid-cols-7", 8: "lg:grid-cols-8",
};

export function HomeCategories({ categories }: { categories: StorefrontCategory[] }) {
  const departments = visibleCategories(categories, 12);
  if (departments.length === 0) return null;
  const cols = Math.min(departments.length, 8);

  return (
    <Section
      id="departments"
      aria-labelledby="categories-heading"
      className="scroll-mt-[var(--sf-header-h)]"
    >
      <SectionHeading
        id="categories-heading"
        title="تسوّق حسب القسم"
        action={{ label: "كل المنتجات", href: routes.shop() }}
      />

      <ul className={`sf-rail -mx-4 gap-3 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:gap-5 ${LG_COLS[cols]} lg:overflow-visible lg:px-0`}>
        {departments.map((category, index) => (
          <li
            key={category.id}
            className={`w-[38vw] max-w-[180px] sm:w-[26vw] lg:w-auto lg:max-w-none ${index >= cols ? "lg:hidden" : ""}`}
          >
            <CategoryTile
              category={category}
              sizes="(min-width: 1024px) 13vw, (min-width: 640px) 26vw, 38vw"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
