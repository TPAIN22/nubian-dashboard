/**
 * Nubian lockup.
 *
 * Same asset as before (`/logo.png` — the gold-and-teal "N" monogram with the
 * Nubian figure). Two changes: the mark is given explicit dimensions so it
 * cannot shift the header while it loads, and the wordmark is the Arabic name
 * alone. The previous lockup set "نوبيان" and "nubian" side by side in two
 * weights, which reads as a tagline rather than a name and spaced itself with
 * a physical `ml-1` that fell on the wrong side under RTL.
 */

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function StorefrontLogo({
  className,
  priority = false,
  inverse = false,
}: {
  className?: string;
  priority?: boolean;
  /** On the dark footer ground. */
  inverse?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("sf-focus group inline-flex items-center gap-2.5", className)}
      aria-label="نوبيان — الصفحة الرئيسية"
    >
      <Image
        src="/logo.png"
        alt=""
        width={36}
        height={36}
        priority={priority}
        className="h-9 w-9 object-contain"
      />
      <span
        className={cn(
          "sf-heading text-[1.35rem] leading-none font-bold",
          inverse ? "text-sf-inverse-foreground" : "text-sf-ink",
        )}
      >
        نوبيان
      </span>
    </Link>
  );
}
