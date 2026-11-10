/**
 * Public storefront shell.
 *
 * `.storefront-theme` scopes the shop's palette (see globals.css) so the
 * admin and merchant consoles keep theirs. `dir` and `lang` stay on <html> in
 * the root layout — setting them again here would be a redundant nested
 * declaration.
 *
 * The type family is set by `.storefront-theme` in CSS rather than by a
 * utility class here — see the note on that rule for why `font-*` utilities
 * do not resolve in this project.
 */

import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="storefront-theme bg-background text-foreground flex min-h-screen flex-col antialiased">
      <StorefrontHeader />
      {/* Target of the header's skip link. */}
      <main id="main" className="flex-1">
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
}
