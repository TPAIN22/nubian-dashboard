/**
 * Department index.
 *
 * Typographic, not photographic. This used to be a row of image tiles built
 * from each category's uploaded art, which put the brand's least consistent
 * imagery — a merchant logo on a baked-in transparency checkerboard, a white
 * flat lay, a generated render — side by side directly under the campaign
 * frames, and repeated the departments chapter's job with worse pictures.
 *
 * The chapter above is where departments are *seen*. This is where they are
 * *chosen*: every department, set large in the display face, numbered, ruled,
 * one tap each. It is also the target of the opening frame's "تصفّح الأقسام".
 *
 * `visibleCategories` still decides the list — it drops the seeded English
 * rows and the duplicate "احذية رجالية" — and the section returns null if
 * nothing survives, so an outage removes the band instead of titling a void.
 */

import Link from "next/link";

import { visibleCategories } from "../CategoryTile";
import { Section, SectionHeading } from "../Section";
import { routes } from "@/lib/storefront/routes";
import type { StorefrontCategory } from "@/lib/storefront/types";

export function HomeCategories({ categories }: { categories: StorefrontCategory[] }) {
  const departments = visibleCategories(categories, 12);
  if (departments.length === 0) return null;

  return (
    <Section id="departments" aria-labelledby="categories-heading" className="bg-sf-sand scroll-mt-[var(--sf-header-h)]">
      <SectionHeading
        id="categories-heading"
        eyebrow="الأقسام"
        title="ابدأ من القسم."
        action={{ label: "كل المنتجات", href: routes.shop() }}
      />

      <ul className="border-sf-ink/15 grid border-t sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-12">
        {departments.map((category, index) => (
          <li key={category.id} className="border-sf-ink/15 border-b">
            <Link
              href={routes.category(category.id)}
              className="sf-focus group flex items-baseline gap-4 py-5 transition-colors md:py-7"
            >
              <span className="sf-meta w-6 shrink-0 tabular-nums">
                <bdi>{String(index + 1).padStart(2, "0")}</bdi>
              </span>
              <span className="sf-kufi text-sf-ink group-hover:text-sf-accent flex-1 text-[1.5rem] leading-tight font-medium transition-colors md:text-[1.75rem]">
                {category.name}
              </span>
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="text-sf-ink/40 group-hover:text-sf-accent h-4 w-4 shrink-0 self-center transition-[color,translate] group-hover:-translate-x-1 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3l5 5-5 5" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
