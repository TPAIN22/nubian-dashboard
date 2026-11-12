/**
 * Storefront call-to-action.
 *
 * A separate primitive from `components/ui/button` on purpose. That one
 * defaults to `rounded-full` and a gold fill, which is right for the console's
 * dense forms and wrong for an editorial page where a row of pills reads as a
 * toolbar. These are near-square, ink-filled, and there are exactly two:
 * one primary, one quiet.
 *
 * Renders an `<a>` — every storefront CTA is navigation, not a form action.
 */

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const BASE =
  "sf-focus inline-flex items-center justify-center gap-2 rounded-[3px] px-7 text-sm font-medium transition-colors duration-200 whitespace-nowrap";

/**
 * Hover on the filled variants lands on Nubian gold. The label has to flip to
 * black at the same time: #FAFAF7 on #D4AF37 is 2.1:1, black on #D4AF37 is
 * 10.0:1. `--primary-foreground` is that black, in both themes.
 */
const VARIANTS = {
  primary:
    "bg-sf-ink text-background hover:bg-primary hover:text-primary-foreground",
  outline:
    "border border-sf-rule-strong text-sf-ink hover:border-sf-ink hover:bg-sf-well",
  /** For use on the inverted (dark) bands. */
  inverse:
    "bg-sf-inverse-foreground text-sf-inverse hover:bg-primary hover:text-primary-foreground",
} as const;

const SIZES = {
  default: "h-11",
  lg: "h-13 px-9 text-[0.9375rem]",
} as const;

interface StoreButtonProps extends Omit<ComponentProps<typeof Link>, "children"> {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export function StoreButton({
  children,
  variant = "primary",
  size = "default",
  className,
  ...props
}: StoreButtonProps) {
  return (
    <Link className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </Link>
  );
}

/** Same styling for links that leave the site (the app store, for instance). */
export function StoreButtonExternal({
  children,
  variant = "primary",
  size = "default",
  className,
  ...props
}: ComponentProps<"a"> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}) {
  return (
    <a
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}
