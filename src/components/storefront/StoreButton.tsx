/**
 * Storefront call-to-action.
 *
 * A separate primitive from `components/ui/button`, which is styled for the
 * console. Storefront buttons are emerald-filled (primary), hairline (outline)
 * or light-on-dark (inverse), with a 12px radius.
 *
 * Renders an `<a>` — every storefront CTA is navigation, not a form action.
 */

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Buttons step up on hover and press in on click — the one motion every
 * storefront control shares. Transform only, so it stays on the compositor;
 * `motion-reduce` keeps the colour change and drops the movement.
 */
const BASE =
  "sf-focus inline-flex items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,translate,scale] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98] motion-reduce:transition-colors motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100";

const VARIANTS = {
  primary:
    "bg-primary text-primary-foreground hover:bg-sf-accent-hover shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
  outline:
    "border border-sf-rule-strong bg-card text-sf-ink hover:border-sf-ink/40 hover:bg-sf-well",
  /** For use on the inverted (dark) bands. */
  inverse:
    "bg-sf-inverse-foreground text-sf-inverse hover:bg-white",
} as const;

const SIZES = {
  default: "h-11",
  lg: "h-12 px-8 text-[0.9375rem]",
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
