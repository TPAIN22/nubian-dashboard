"use client";

/**
 * Background footage for a story chapter.
 *
 * The poster image is always painted underneath the video, never as the
 * `<video poster>` attribute alone. That one choice covers most of what can
 * go wrong: a codec the browser will not decode, a file that 404s, autoplay
 * blocked by a power-saving policy, or a visitor who has asked for reduced
 * motion. In every one of those cases the chapter is still a composed frame
 * with a photograph in it, because the photograph was never conditional.
 *
 * Reduced motion is honoured before the network is touched. The `<video>` is
 * not rendered at all when the user prefers less motion, so the footage is
 * never fetched — respecting the preference and saving several megabytes on
 * exactly the devices most likely to be metered.
 *
 * The preference is read in an effect rather than during render. Reading it
 * during render would produce one HTML on the server (where no media query
 * exists) and another on the client, which is a hydration mismatch; starting
 * from "no video" and upgrading after mount is the only order that is safe
 * in both directions.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { ik, isImageKit } from "@/lib/storefront/image";

interface StoryVideoProps {
  src: string;
  type: string;
  poster: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function StoryVideo({
  src,
  type,
  poster,
  alt,
  className,
  priority = false,
}: StoryVideoProps) {
  // Server render and first client render agree: poster only.
  const [playable, setPlayable] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPlayable(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !playable) return;
    // Autoplay can be refused even when muted (low-power mode, data saver).
    // A rejected promise is not an error here — it just means the poster
    // stays, which is a perfectly good frame.
    const attempt = el.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => setPlayable(false));
    }
  }, [playable]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={ik(poster, { width: 1800, quality: 80 })}
        unoptimized={isImageKit(poster)}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes="100vw"
        className="object-cover object-center"
      />

      {playable && (
        <video
          ref={videoRef}
          // `muted` and `playsInline` are what make inline autoplay legal on
          // iOS at all; without both, Safari opens the system player.
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setPlayable(false)}
          className="absolute inset-0 h-full w-full object-cover object-center"
        >
          <source src={src} type={type} />
        </video>
      )}
    </div>
  );
}
