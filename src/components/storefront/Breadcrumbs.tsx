/**
 * Breadcrumb trail for catalogue pages.
 *
 * Plain `nav > ol`, so the sequence is announced as a list and the current
 * page is marked with `aria-current` rather than only looking different. The
 * separator is an aria-hidden slash; in RTL it needs no mirroring because a
 * forward slash is direction-neutral in this position.
 */

import Link from "next/link";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Omit on the final crumb. */
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="مسار التصفح" className={cn("sf-meta", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className="max-w-[16rem] truncate">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="sf-focus hover:text-sf-ink inline-block py-1 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-sf-ink">
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-sf-rule-strong select-none">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
