"use client";

/**
 * Mobile navigation drawer.
 *
 * Built on the project's existing Radix-backed `Sheet` rather than a bespoke
 * `useState` panel, so it inherits a real dialog: focus moves into it and is
 * trapped, Escape closes it, the page behind is inert and marked
 * `aria-hidden`, and the trigger gets `aria-expanded` for free. The previous
 * header rendered an absolutely-positioned div that did none of that.
 *
 * Categories arrive as props from the server component that already fetched
 * them — the drawer does not fetch, and its JS does not block the header.
 */

import Link from "next/link";
import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { routes, PLAY_STORE_URL } from "@/lib/storefront/routes";
import type { StorefrontCategory } from "@/lib/storefront/types";

interface MobileNavProps {
  categories: StorefrontCategory[];
}

export function MobileNav({ categories }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="sf-focus text-sf-ink -ms-2 inline-flex h-11 w-11 items-center justify-center lg:hidden"
        aria-label="فتح القائمة"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
        </svg>
      </SheetTrigger>

      <SheetContent
        side="right"
        // `[&>button]` repositions the dismiss control that `SheetContent`
        // renders for us. Its default is `top-4 right-4` — physical values,
        // written for an LTR console — and physical right is the *start* edge
        // under RTL, so it landed on top of the panel title. The selector
        // matches only that button: every other direct child here is a div.
        className="storefront-theme bg-background border-sf-rule w-[86vw] gap-0 overflow-y-auto p-0 sm:max-w-sm [&>button]:right-auto [&>button]:left-4"
      >
        <SheetHeader className="border-sf-rule border-b px-6 py-5">
          <SheetTitle className="sf-product-name text-base">التصفح</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col px-6 py-6" aria-label="قائمة التنقل">
          <Link
            href={routes.shop()}
            onClick={close}
            className="sf-focus text-sf-ink hover:text-sf-accent py-3 text-lg font-medium transition-colors"
          >
            كل المنتجات
          </Link>

          {categories.length > 0 && (
            <>
              <p className="text-muted-foreground mt-5 mb-1 text-xs font-semibold">
                الأقسام
              </p>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={routes.category(category.id)}
                  onClick={close}
                  className="sf-focus text-sf-ink hover:text-sf-accent py-2.5 text-base transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </>
          )}

          <div className="border-sf-rule mt-6 flex flex-col border-t pt-6">
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={close}
                className="sf-focus text-sf-ink hover:text-sf-accent py-2.5 text-base transition-colors"
              >
                تسجيل الدخول
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/merchant/dashboard"
                onClick={close}
                className="sf-focus text-sf-ink hover:text-sf-accent py-2.5 text-base transition-colors"
              >
                لوحة التحكم
              </Link>
            </SignedIn>
            <Link
              href="/merchant/apply"
              onClick={close}
              className="sf-focus text-sf-ink hover:text-sf-accent py-2.5 text-base transition-colors"
            >
              بِع على نوبيان
            </Link>
            <Link
              href="/contact"
              onClick={close}
              className="sf-focus text-sf-ink hover:text-sf-accent py-2.5 text-base transition-colors"
            >
              تواصل معنا
            </Link>
          </div>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="sf-focus bg-sf-ink text-background hover:bg-primary hover:text-primary-foreground mt-7 inline-flex h-12 items-center justify-center rounded-[3px] text-sm font-medium transition-colors"
          >
            حمّل تطبيق نوبيان
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
