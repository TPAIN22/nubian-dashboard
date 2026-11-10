/**
 * Category tile.
 *
 * The brief for this one was "do not turn every category into a large,
 * heavily bordered card": the photograph is the tile, and the label sits
 * under it in plain type. No frame, no overlay gradient, no caption burned
 * into the image — a single 3:4 crop and a name.
 *
 * Categories without an image are filtered out upstream rather than rendered
 * as a grey rectangle; see `visibleCategories`.
 */

import Link from "next/link";

import { StoreImage } from "./StoreImage";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/storefront/routes";
import type { StorefrontCategory } from "@/lib/storefront/types";

interface CategoryTileProps {
  category: StorefrontCategory;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export function CategoryTile({
  category,
  priority = false,
  sizes = "(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 42vw",
  className,
}: CategoryTileProps) {
  return (
    <Link
      href={routes.category(category.id)}
      className={cn("sf-focus group block", className)}
    >
      <StoreImage
        src={category.image}
        alt={`تصفح قسم ${category.name}`}
        className="aspect-[3/4] w-full"
        sizes={sizes}
        priority={priority}
        transformWidth={520}
        imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      <h3 className="sf-product-name group-hover:text-sf-accent mt-3 transition-colors">
        {category.name}
      </h3>
    </Link>
  );
}

/**
 * Categories fit to show in a visual grid.
 *
 * Drops three kinds of row the live taxonomy contains:
 *   - no image (the seeded `Electronics` / `Men's Fashion` rows carry only an
 *     emoji icon, and an emoji is not art direction),
 *   - duplicate names (the taxonomy has two "احذية رجالية" entries, one empty),
 *   - anything beyond `limit`, so the grid stays a considered selection.
 *
 * Top-level categories are preferred over subcategories because they are the
 * ones a shopper recognises as a department.
 */
export function visibleCategories(
  categories: StorefrontCategory[],
  limit = 6,
): StorefrontCategory[] {
  const seen = new Set<string>();
  const withImages = categories.filter((category) => {
    if (!category.image) return false;
    const key = category.name.trim().toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const byRank = (a: StorefrontCategory, b: StorefrontCategory) =>
    merchandisingRank(a) - merchandisingRank(b);
  const roots = withImages.filter((c) => c.parentId === null && !isRestricted(c)).sort(byRank);
  const children = withImages.filter((c) => c.parentId !== null && !isRestricted(c)).sort(byRank);
  const restricted = withImages.filter(isRestricted);

  return [...roots, ...children, ...restricted].slice(0, limit);
}

/**
 * Merchandising order — not database order.
 *
 * The taxonomy comes back in insertion order, which put "سجائر وشيشة" (an
 * age-restricted department with no live products) first in the header and
 * the department index. Departments are ranked by how broad the audience is
 * and how much live stock stands behind the link (Nov 2026: عطور 19,
 * ملابس نسائية 7, احذية 4, اكسسوارات 2, الملابس الرجالية 2):
 *
 *   عطور → ملابس نسائية → الملابس الرجالية → احذية → اكسسوارات → anything new
 *
 * Perfume leads because it is the deepest shelf and the opening frame's
 * subject. Clothing is kept as a pair so women's and men's sit together.
 * A department that matches no pattern keeps its data order after these.
 * Restricted goods are never removed — they are listed last, after the
 * subcategories, so no shopper meets tobacco as the first thing the store
 * offers.
 */
const MERCHANDISING_ORDER: RegExp[] = [
  /عطور|عطر/,
  /نسائ/,
  /رجال/,
  /احذية|أحذية/,
  /اكسسوار|إكسسوار/,
];
const RESTRICTED = /سجائر|شيشة|تبغ/;

function merchandisingRank(category: StorefrontCategory): number {
  const index = MERCHANDISING_ORDER.findIndex((pattern) => pattern.test(category.name));
  return index === -1 ? MERCHANDISING_ORDER.length : index;
}

function isRestricted(category: StorefrontCategory): boolean {
  return RESTRICTED.test(category.name);
}
