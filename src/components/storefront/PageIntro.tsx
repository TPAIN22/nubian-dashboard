/**
 * Masthead for catalogue pages.
 *
 * Breadcrumb, H1, optional blurb — one construction shared by /shop, the
 * category, collection and store pages, which is what keeps those four from
 * each inventing their own heading spacing.
 */

import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { Container } from "./Section";
import { cn } from "@/lib/utils";

interface PageIntroProps {
  crumbs: Crumb[];
  title: string;
  description?: string;
  /** Right-hand slot: a result count, a sort control, a store logo. */
  aside?: React.ReactNode;
  className?: string;
}

export function PageIntro({
  crumbs,
  title,
  description,
  aside,
  className,
}: PageIntroProps) {
  return (
    <Container className={cn("pt-8 pb-10 md:pt-12 md:pb-14", className)}>
      <Breadcrumbs items={crumbs} />
      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="max-w-2xl">
          <h1 className="sf-title text-sf-ink">{title}</h1>
          {description && <p className="sf-body mt-4">{description}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </Container>
  );
}

/**
 * Designed empty state.
 *
 * Used only where an empty result is a legitimate answer a shopper asked for
 * — a search with no matches, a category that has been emptied. Sections
 * whose emptiness is incidental hide themselves instead of rendering this.
 */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-sf-rule flex flex-col items-center border-y px-6 py-20 text-center md:py-28">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="text-sf-rule-strong h-10 w-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 4.5 4.5" />
      </svg>
      <h2 className="sf-title text-sf-ink mt-6 text-[1.375rem] md:text-2xl">{title}</h2>
      <p className="sf-body mt-3 max-w-md">{body}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
