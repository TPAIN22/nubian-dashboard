/**
 * Catalogue pagination.
 *
 * Previous/next anchors rather than a page-number strip: the listing is one
 * ranked sequence, nobody navigates to page 7 of it directly, and two links
 * keep the control honest at any catalogue size. Real `<a>` elements, so the
 * pages are crawlable and middle-click works.
 *
 * Direction is handled by the writing mode, not by swapping labels: "السابق"
 * is always the earlier page and its chevron is mirrored with `rtl:rotate-180`.
 */

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { StorefrontPagination } from "@/lib/storefront/types";

interface PaginationProps {
  pagination: StorefrontPagination | null;
  /** Builds the href for a given page number. */
  hrefFor: (page: number) => string;
  className?: string;
}

const LINK =
  "sf-focus border-sf-rule-strong text-sf-ink hover:border-sf-ink hover:bg-sf-well inline-flex h-11 items-center gap-2 rounded-[3px] border px-5 text-sm font-medium transition-colors";

function Chevron({ back }: { back: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5 rtl:rotate-180", back && "rotate-180 rtl:rotate-0")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

export function Pagination({ pagination, hrefFor, className }: PaginationProps) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, hasPrevPage, hasNextPage } = pagination;

  return (
    <nav
      aria-label="تنقّل بين الصفحات"
      className={cn(
        "border-sf-rule mt-16 flex items-center justify-between gap-4 border-t pt-8",
        className,
      )}
    >
      {hasPrevPage ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={LINK}>
          <Chevron back />
          السابق
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}

      <p className="sf-meta tabular-nums">
        صفحة <bdi>{page}</bdi> من <bdi>{totalPages}</bdi>
      </p>

      {hasNextPage ? (
        <Link href={hrefFor(page + 1)} rel="next" className={LINK}>
          التالي
          <Chevron back={false} />
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
