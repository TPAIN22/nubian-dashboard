import React from "react";
import { cn } from "@/lib/utils";

/**
 * Legacy in-flow page header.
 *
 * The admin design system's `PageHeader` (@/components/admin) is the real one —
 * it is sticky, pairs with `Page`/`PageBody`, and is what redesigned routes use.
 * This adapter exists so pages that have not been migrated yet still get the new
 * typography and density instead of the old 3xl title + 32px separator, which
 * alone ate ~110px above the fold on every list.
 *
 * When migrating a page: swap this for `Page` + `PageHeader` + `PageBody` and
 * drop the surrounding `container mx-auto py-8` wrapper.
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-[20px] font-semibold leading-7 tracking-[-0.011em] text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-muted">{description}</p>
        )}
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
