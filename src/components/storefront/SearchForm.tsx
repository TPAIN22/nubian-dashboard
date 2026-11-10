/**
 * Catalogue search.
 *
 * A plain GET form pointed at `/shop`. No `useState`, no router push, no
 * client component — the browser serialises `q` into the query string and
 * Next renders the results on the server. Search therefore works with
 * JavaScript disabled, survives a slow bundle, and costs the storefront
 * nothing in hydration.
 *
 * `type="search"` gives mobile keyboards the search action key and desktop
 * browsers the native clear button.
 */

import { cn } from "@/lib/utils";

interface SearchFormProps {
  defaultValue?: string;
  className?: string;
  /** Distinguishes the two instances that can be on the page at once. */
  id?: string;
  autoFocus?: boolean;
}

export function SearchForm({
  defaultValue = "",
  className,
  id = "storefront-search",
  autoFocus = false,
}: SearchFormProps) {
  return (
    <form action="/shop" method="get" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        ابحث في منتجات نوبيان
      </label>

      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 start-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="M13.5 13.5 17 17" />
      </svg>

      <input
        id={id}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="ابحث عن منتج أو متجر"
        autoComplete="off"
        autoFocus={autoFocus}
        className="border-sf-rule bg-card text-sf-ink placeholder:text-muted-foreground focus-visible:border-sf-accent focus-visible:ring-sf-accent/25 h-11 w-full rounded-[3px] border ps-10 pe-3 text-sm outline-none transition-colors focus-visible:ring-2"
      />
    </form>
  );
}
