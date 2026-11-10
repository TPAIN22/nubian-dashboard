"use client";

/**
 * The storefront's only image component.
 *
 * Three jobs, all of which the pages got wrong before:
 *
 * - **No layout shift.** The caller sets the aspect ratio on the wrapper and
 *   the image fills it. Space is reserved before a byte arrives.
 * - **No broken-image icon, ever.** A missing `src` and a `src` that 404s take
 *   the same path: the branded fallback. Merchant-supplied URLs do rot, and a
 *   grey box with a torn-page glyph reads as a broken site.
 * - **Right bytes.** ImageKit is asked for roughly the painted size via `ik`,
 *   and `sizes` tells the browser which candidate to pick.
 *
 * Client component only because `onError` needs a listener; it renders no
 * state on first paint beyond what the server already sent, so there is
 * nothing for hydration to disagree about.
 */

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { ik } from "@/lib/storefront/image";

interface StoreImageProps {
  src: string | null | undefined;
  alt: string;
  /** Tailwind aspect ratio class for the wrapper, e.g. `aspect-[4/5]`. */
  className?: string;
  imageClassName?: string;
  sizes: string;
  /** Set on the LCP image only. Everything else lazy-loads. */
  priority?: boolean;
  /** Width hint handed to ImageKit. Use the largest size the slot is painted at. */
  transformWidth?: number;
  quality?: number;
  /** `contain` for logos and packshots that must not be cropped. */
  fit?: "cover" | "contain";
  /** CSS `object-position` for art-directed crops, e.g. `"60% 40%"`. */
  objectPosition?: string;
}

/**
 * Fallback mark: the Nubian "N" reduced to a quiet monogram on the warm well
 * colour. It reads as an intentional empty state rather than a failure, and it
 * is drawn in CSS so it cannot itself fail to load.
 */
function ImageFallback({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 grid place-items-center bg-sf-well"
      role="img"
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-8 w-8 text-sf-rule-strong"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20V4l16 16V4" />
      </svg>
    </div>
  );
}

export function StoreImage({
  src,
  alt,
  className,
  imageClassName,
  sizes,
  priority = false,
  transformWidth,
  quality,
  fit = "cover",
  objectPosition,
}: StoreImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = (src ?? "").trim();
  const usable = resolved !== "" && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-sf-well", className)}>
      {usable ? (
        <Image
          src={ik(resolved, { width: transformWidth, quality })}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          onError={() => setFailed(true)}
          style={objectPosition ? { objectPosition } : undefined}
          className={cn(
            fit === "cover" ? "object-cover" : "object-contain",
            imageClassName,
          )}
        />
      ) : (
        // `alt` is the product or category name, which is already announced by
        // the adjacent text, so the fallback is labelled generically instead of
        // repeating it to a screen reader.
        <ImageFallback label="لا توجد صورة" />
      )}
    </div>
  );
}
