/**
 * Storefront header.
 *
 * A server component: navigation comes from the live category taxonomy, and
 * the only client JavaScript is two small islands (`HeaderAccount` for Clerk,
 * `MobileNav` for the drawer) plus the theme switch.
 *
 * Layout:
 *   - >=1024px: lockup | wide search | theme + account, then a quiet row of
 *     department links underneath.
 *   - <1024px:  drawer + lockup + account, then a full-width search row.
 *
 * Search is visible at every width: it is the primary action on a marketplace.
 */

import Link from "next/link";

import { StorefrontLogo } from "./StorefrontLogo";
import { SearchForm } from "./SearchForm";
import { HeaderAccount } from "./HeaderAccount";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { Container } from "./Section";
import { getCategories } from "@/lib/storefront/api";
import { visibleCategories } from "./CategoryTile";
import { routes } from "@/lib/storefront/routes";
import { cn } from "@/lib/utils";

/** `py-2.5` takes each link to a 40px target. */
const NAV_LINK =
  "sf-focus text-sf-ink-soft hover:text-sf-ink inline-flex items-center py-2.5 text-[0.875rem] font-medium transition-colors whitespace-nowrap";

export async function StorefrontHeader() {
  const categories = await getCategories();
  const departments = visibleCategories(categories, 7);
  const drawerCategories = visibleCategories(categories, 12);

  return (
    <header className="bg-background/90 border-sf-rule sticky top-0 z-50 border-b backdrop-blur-md">
      {/* Skip link: the first tab stop on every storefront page. */}
      <a
        href="#main"
        className="sf-focus bg-primary text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:z-50 focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:start-4"
      >
        تخطَّ إلى المحتوى
      </a>

      <Container>
        <div className="flex h-16 items-center gap-3 lg:h-[72px] lg:gap-8">
          <div className="flex shrink-0 items-center gap-1">
            <MobileNav categories={drawerCategories} />
            <StorefrontLogo priority />
          </div>

          <SearchForm
            id="header-search"
            className="mx-auto hidden w-full max-w-xl lg:block"
          />

          <div className="ms-auto flex shrink-0 items-center gap-1.5 lg:ms-0 lg:gap-3">
            <ThemeToggle />
            <HeaderAccount />
          </div>
        </div>

        {/* Mobile search row. Separate instance so each input keeps a unique id. */}
        <div className="pb-3 lg:hidden">
          <SearchForm id="header-search-mobile" />
        </div>
      </Container>

      {/* Department row, desktop only. */}
      <nav aria-label="الأقسام" className="border-sf-rule hidden border-t lg:block">
        <Container>
          <ul className="flex h-[45px] items-center gap-7 overflow-hidden">
            <li>
              <Link href={routes.shop()} className={cn(NAV_LINK, "text-sf-ink font-semibold")}>
                كل المنتجات
              </Link>
            </li>
            {departments.map((category) => (
              <li key={category.id}>
                <Link href={routes.category(category.id)} className={NAV_LINK}>
                  {category.name}
                </Link>
              </li>
            ))}
            <li className="ms-auto">
              <Link href="/merchant/apply" className={cn(NAV_LINK, "text-sf-accent hover:text-sf-accent-hover")}>
                بِع على نوبيان
              </Link>
            </li>
          </ul>
        </Container>
      </nav>
    </header>
  );
}
