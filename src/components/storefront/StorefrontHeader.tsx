/**
 * Storefront header.
 *
 * A server component. Navigation comes from the live category taxonomy, so
 * the header cannot advertise a department that was deleted, and it costs no
 * client JavaScript — the only interactive pieces are two small islands
 * (`HeaderAccount` for Clerk, `MobileNav` for the drawer).
 *
 * Sticky, with one hairline rule and nothing else. The old header animated
 * its padding, background and border on every scroll event via a
 * `useState` + `scroll` listener; that is a layout-shifting re-render per
 * frame in exchange for an effect nobody asked for.
 *
 * Shape differs by breakpoint rather than shrinking:
 *   - >=1024px: one row — lockup, departments, search, account
 *   - <1024px:  two rows — drawer + lockup + account, then full-width search
 *
 * The split is at `lg`, not `md`. At 834px (iPad portrait) the single-row
 * layout measured 843px of content against an 834px viewport and pushed the
 * page into horizontal scroll; a tablet gets the drawer, which is what a
 * tablet expects anyway. Search stays visible at every width rather than
 * hiding behind a tap — it is the primary action on a marketplace.
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

/**
 * `py-1.5` is not decoration: the text alone is a 20px line box, and WCAG 2.5.8
 * wants 24px of target. The padding takes each link to 32px without moving it,
 * since the row is centred.
 */
const NAV_LINK =
  "sf-focus text-sf-ink hover:text-sf-accent inline-flex items-center py-1.5 text-sm font-medium transition-colors whitespace-nowrap";

export async function StorefrontHeader() {
  const categories = await getCategories();
  // Four departments in the bar, the full list in the drawer and the footer.
  const departments = visibleCategories(categories, 4);
  const drawerCategories = visibleCategories(categories, 10);

  return (
    <header className="bg-background/95 border-sf-rule sticky top-0 z-50 border-b backdrop-blur-sm">
      {/* Skip link: the first tab stop on every storefront page. */}
      <a
        href="#main"
        className="sf-focus bg-sf-ink text-background sr-only focus:not-sr-only focus:absolute focus:top-2 focus:z-50 focus:rounded-[3px] focus:px-4 focus:py-2 focus:text-sm focus:start-4"
      >
        تخطَّ إلى المحتوى
      </a>

      <Container>
        <div className="flex h-16 items-center justify-between gap-4 lg:h-[72px] lg:gap-8">
          <div className="flex min-w-0 items-center gap-1 lg:gap-8">
            <MobileNav categories={drawerCategories} />
            <StorefrontLogo priority />

            <nav aria-label="الأقسام" className="hidden items-center gap-6 lg:flex xl:gap-7">
              <Link href={routes.shop()} className={NAV_LINK}>
                كل المنتجات
              </Link>
              {departments.map((category) => (
                <Link
                  key={category.id}
                  href={routes.category(category.id)}
                  className={NAV_LINK}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:gap-4">
            <SearchForm
              id="header-search"
              className="hidden lg:block lg:w-56 xl:w-72"
            />
            <ThemeToggle />
            <HeaderAccount />
          </div>
        </div>

        {/* Mobile search row. Separate instance so each input keeps a unique id. */}
        <div className="border-sf-rule/70 -mx-5 border-t px-5 py-2.5 md:-mx-8 md:px-8 lg:hidden">
          <SearchForm id="header-search-mobile" />
        </div>
      </Container>
    </header>
  );
}
