"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { OrderLine } from "./types";

/**
 * The "Items" column.
 *
 * ## Why it is built this way
 *
 * A row must be the same height whether the order has one product or forty,
 * otherwise the table stops being scannable — that was the original problem.
 * So the cell always renders exactly `PREVIEW_LIMIT` slots plus one overflow
 * slot, and pads with empty (but space-occupying) rows when there are fewer
 * products. Nothing here can grow: names truncate, the list never wraps, and
 * the overflow chip lives in a slot that is reserved even when it is unused.
 *
 * The remainder is reachable without leaving the table via a hover/focus
 * tooltip on the chip. Opening the drawer is still the way to see everything —
 * the tooltip is a peek, so it caps itself at `TOOLTIP_LIMIT` rather than
 * turning into a scrollable panel.
 */

const PREVIEW_LIMIT = 3;
const TOOLTIP_LIMIT = 8;

/** Fixed geometry. Row height × limit is what makes every table row identical. */
const ROW_HEIGHT = "h-6";
const THUMB_SIZE = "size-6";

const CHIP_CLASS =
  "inline-flex h-5 items-center rounded-full border border-dashed border-border px-2 text-[11px] font-medium text-muted-foreground";

function Thumbnail({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = React.useState(false);

  // Plain <img>, not next/image: product images come from whatever host the
  // merchant uploaded through, and only ImageKit/Unsplash are in
  // `next.config.ts` remotePatterns. The CSP already allows `img-src https:`,
  // so a raw tag renders every product; the optimizer would 400 on some.
  if (!src || failed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded border border-border/60 bg-muted",
          THUMB_SIZE,
          className,
        )}
        aria-hidden="true"
      >
        <ImageOff className="size-3 text-muted-foreground/70" />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(
        "shrink-0 rounded border border-border/60 bg-muted object-cover",
        THUMB_SIZE,
        className,
      )}
    />
  );
}

function PreviewLine({ line }: { line: OrderLine }) {
  return (
    <div className={cn("flex items-center gap-2", ROW_HEIGHT)}>
      <Thumbnail src={line.image} alt={line.name} />
      <span className="min-w-0 flex-1 truncate text-xs text-foreground" title={line.name}>
        {line.name}
      </span>
      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
        ×{line.quantity}
      </span>
    </div>
  );
}

export function OrderItemsCell({
  lines,
  className,
  /**
   * Whether the overflow chip is its own control. Radix tooltips are hover-only
   * by design — they don't open on touch — so on the mobile card the chip is
   * rendered as plain text and the whole card opens the drawer instead of the
   * chip swallowing the tap and doing nothing.
   */
  overflowInteractive = true,
}: {
  lines: OrderLine[];
  className?: string;
  overflowInteractive?: boolean;
}) {
  const preview = lines.slice(0, PREVIEW_LIMIT);
  const rest = lines.slice(PREVIEW_LIMIT);
  const remaining = rest.length;

  if (lines.length === 0) {
    // Still occupies the full slot height so the row matches its neighbours.
    return (
      <div className={cn("w-[220px]", className)}>
        <div className="flex flex-col gap-1">
          {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
            <div key={i} className={cn("flex items-center", ROW_HEIGHT)}>
              {i === 0 ? (
                <span className="text-xs text-muted-foreground">لا توجد منتجات</span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-1 h-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={cn("w-[220px]", className)}>
      <div className="flex flex-col gap-1">
        {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => {
          const line = preview[i];
          return line ? (
            <PreviewLine key={line.key} line={line} />
          ) : (
            // Spacer: keeps a 1-item order exactly as tall as a 3-item one.
            <div key={`empty-${i}`} className={ROW_HEIGHT} aria-hidden="true" />
          );
        })}
      </div>

      {/* Overflow slot — reserved unconditionally so the chip's presence never
          changes the row height. */}
      <div className="mt-1 flex h-5 items-center">
        {remaining > 0 ? (
          overflowInteractive ? (
            <MoreItemsChip remaining={remaining} rest={rest} />
          ) : (
            <span className={CHIP_CLASS}>+{remaining} أخرى</span>
          )
        ) : null}
      </div>
    </div>
  );
}

function MoreItemsChip({ remaining, rest }: { remaining: number; rest: OrderLine[] }) {
  const listed = rest.slice(0, TOOLTIP_LIMIT);
  const overflow = remaining - listed.length;

  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <button
          type="button"
          // The row itself opens the drawer; peeking at the rest of the basket
          // should not. Keyboard users get the same peek via focus.
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={`عرض باقي المنتجات (${remaining})`}
          className={cn(
            CHIP_CLASS,
            "transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          )}
        >
          +{remaining} أخرى
        </button>
      </TooltipTrigger>

      <TooltipContent
        side="top"
        align="start"
        showArrow={false}
        className="w-[260px] border border-border/70 bg-popover p-0 text-popover-foreground shadow-lg"
      >
        <p className="border-b border-border/60 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
          باقي المنتجات ({remaining})
        </p>

        <ul className="space-y-1.5 p-2">
          {listed.map((line) => (
            <li key={line.key} className="flex items-center gap-2">
              <Thumbnail src={line.image} alt={line.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-foreground">{line.name}</span>
                {line.variantLabel ? (
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {line.variantLabel}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                ×{line.quantity}
              </span>
            </li>
          ))}
        </ul>

        {overflow > 0 ? (
          <p className="border-t border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
            و{overflow} منتج آخر — افتح الطلب لعرض القائمة كاملة
          </p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

export { Thumbnail as OrderItemThumbnail, PREVIEW_LIMIT };
