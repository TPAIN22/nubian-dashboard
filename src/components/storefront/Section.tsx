/**
 * Section chrome for the storefront.
 *
 * Every band on a page uses the same container width, the same vertical
 * rhythm and the same heading construction, which is most of what makes a
 * long page read as one design rather than a stack of components. The
 * rhythm is a single scale (`tight` / `default` / `loose`) instead of a
 * per-section guess.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const SPACE = {
  tight: "py-12 md:py-16",
  default: "py-16 md:py-24",
  loose: "py-20 md:py-32",
} as const;

interface SectionProps {
  children: ReactNode;
  className?: string;
  space?: keyof typeof SPACE;
  /** Renders a hairline above the section. Used to separate adjacent bands. */
  divided?: boolean;
  id?: string;
  "aria-labelledby"?: string;
}

export function Section({
  children,
  className,
  space = "default",
  divided = false,
  id,
  "aria-labelledby": labelledBy,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        SPACE[space],
        divided && "border-sf-rule border-t",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** The one container width the storefront uses. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1320px] px-5 md:px-8 lg:px-12", className)}>
      {children}
    </div>
  );
}

interface SectionHeadingProps {
  /** Small label above the title. Never tracked or uppercased — see globals.css. */
  eyebrow?: string;
  title: string;
  /** The id a `<section aria-labelledby>` points at. */
  id?: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
  /** `h2` for a page section, `h3` when already nested under one. */
  as?: "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  title,
  id,
  description,
  action,
  className,
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && <p className="sf-eyebrow mb-2.5">{eyebrow}</p>}
        <Heading id={id} className="sf-title">
          {title}
        </Heading>
        {description && <p className="sf-body mt-3">{description}</p>}
      </div>

      {action && (
        <Link
          href={action.href}
          className="sf-focus text-sf-ink hover:text-sf-accent border-sf-rule-strong hover:border-sf-accent inline-flex shrink-0 items-center gap-2 self-start border-b pt-1.5 pb-2 text-sm font-medium transition-colors md:self-auto"
        >
          {action.label}
          {/* Chevron points along the reading direction: left in RTL. The
              glyph is mirrored by `rtl:rotate-180` rather than swapped for a
              second icon. */}
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="h-3.5 w-3.5 rtl:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3l5 5-5 5" />
          </svg>
        </Link>
      )}
    </div>
  );
}
