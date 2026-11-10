"use client";

/**
 * Account control in the storefront header.
 *
 * Isolated as its own client island so that Clerk's hooks — and the bundle
 * behind them — do not force the whole header to be a client component. The
 * header, its navigation and its search stay server-rendered.
 *
 * Signed-in staff get a direct route to the surface their role owns. That
 * mirrors `middleware.ts`, which bounces an admin or an approved merchant off
 * `/` to their console; the link just saves them the redirect.
 */

import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";

import { cn } from "@/lib/utils";

/** Where a signed-in user's console lives, by role. Mirrors `middleware.ts`. */
function consoleFor(role: string | undefined, merchantStatus: string | undefined) {
  if (role === "admin" || role === "support") return { href: "/admin", label: "لوحة الإدارة" };
  if (role === "merchant") {
    return merchantStatus === "approved"
      ? { href: "/merchant/dashboard", label: "لوحة المتجر" }
      : { href: "/merchant/pending", label: "حالة الطلب" };
  }
  return null;
}

/** `py-1.5` lifts the 20px text line to a 32px target — see `NAV_LINK`. */
const LINK =
  "sf-focus text-sf-ink hover:text-sf-accent inline-flex items-center py-1.5 text-sm font-medium transition-colors";

export function HeaderAccount({ className }: { className?: string }) {
  const { user, isLoaded } = useUser();
  const target = consoleFor(
    user?.publicMetadata?.role as string | undefined,
    user?.publicMetadata?.merchantStatus as string | undefined,
  );

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* A fixed-size placeholder while Clerk resolves: without it the header's
          end cluster reflows the moment auth state lands. */}
      {!isLoaded ? (
        <div className="bg-sf-well h-8 w-24 animate-pulse rounded-[3px]" aria-hidden="true" />
      ) : (
        <>
          <SignedOut>
            <Link href="/sign-in" className={LINK}>
              تسجيل الدخول
            </Link>
          </SignedOut>
          <SignedIn>
            {target && (
              <Link href={target.href} className={cn(LINK, "hidden lg:inline")}>
                {target.label}
              </Link>
            )}
            <UserButton
              afterSignOutUrl="/"
              appearance={{ elements: { avatarBox: "h-8 w-8" } }}
            />
          </SignedIn>
        </>
      )}
    </div>
  );
}
