/**
 * The chapter primitive: a pinned frame and a list of shots.
 *
 * A plain server component — no `"use client"`, no hooks, no effects. All of
 * the motion is declared in CSS against a scroll timeline (see the STORY
 * block in globals.css), so a chapter ships zero bytes of JavaScript and the
 * markup a crawler sees is the markup a reader sees.
 *
 * The only thing this file computes is timing: each beat gets a slice of the
 * chapter's scroll range, expressed as custom properties the stylesheet
 * reads. Keeping that arithmetic here rather than in CSS is what lets a
 * chapter have two shots or five without a stylesheet edit.
 *
 * Shot sequencing, for beat i of n:
 *
 *   beat 0  ├ hold ─────────────┤
 *   beat 1              ├ fade ─┼ hold ──────────┤
 *   beat 2                               ├ fade ─┼ hold ─────┤
 *   0%                                                     100%
 *
 * Beat 0 is already on screen when the pin engages, so it never dissolves
 * in. Every later beat fades up over a window inside the preceding hold, and
 * because beats stack in one grid cell with later ones painted on top, the
 * outgoing shot is simply covered. There is no frame where the stage is
 * empty — the usual failure of a fade-out/fade-in pair.
 *
 * Two layouts:
 *   - `full`  — the photograph is the frame, copy over a scrim.
 *   - `panel` — the photograph sits beside the copy. Used when the source art
 *               is too small to survive full-bleed.
 */

import type { ReactNode } from "react";

import { StoreImage } from "../StoreImage";
import { cn } from "@/lib/utils";

export interface ChapterBeat {
  image: string | null;
  alt: string;
  /** `object-position` for the still, e.g. `"60% 50%"`. */
  imagePosition?: string;
  eyebrow?: string;
  title: ReactNode;
  body?: string;
  /** Rendered under the copy — links into the real catalogue. */
  footer?: ReactNode;
}

interface ChapterProps {
  id: string;
  /** Accessible chapter name, also shown in the frame's slate. */
  name: string;
  beats: ChapterBeat[];
  layout?: "full" | "panel";
  /** Apply the campaign grade to the stills (licensed campaign art only). */
  grade?: boolean;
  /**
   * Ground of the frame. "dark" (ink) is required for the full-bleed layout,
   * where copy sits on the photograph; the panel layout keeps its copy on a
   * plain column and reads either way. Defaults to dark for "full" and light
   * for "panel".
   */
  tone?: "light" | "dark";
  priority?: boolean;
  className?: string;
}

/** Fraction of a beat's slot spent dissolving rather than holding. */
const DISSOLVE = 0.42;

/**
 * Scroll-range slice for beat `i` of `n`, in percentages of the chapter.
 *
 * The dissolve sits at the start of the beat's slot so the incoming shot has
 * fully arrived before its copy is read, rather than still resolving
 * underneath the text.
 */
function beatRange(i: number, n: number): React.CSSProperties {
  const slot = 100 / n;
  const from = i * slot;
  return {
    // Media: dissolve up over the first part of this beat's slot.
    "--from": `${from.toFixed(2)}%`,
    "--to": `${(from + slot * DISSOLVE).toFixed(2)}%`,
    // Copy: owns the slot outright, end to end. Adjacent copy windows abut
    // exactly, and each is at zero opacity at both edges of its own window,
    // so two headlines are never legible at the same instant.
    "--copy-from": `${from.toFixed(2)}%`,
    "--copy-to": `${(from + slot).toFixed(2)}%`,
  } as React.CSSProperties;
}

export function Chapter({
  id,
  name,
  beats,
  layout = "full",
  grade = false,
  tone,
  priority = false,
  className,
}: ChapterProps) {
  const isPanel = layout === "panel";
  // Full-bleed copy sits on the photograph behind a dark scrim, so only the
  // panel layout may go light.
  const dark = !isPanel || (tone ?? "light") === "dark";

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn(
        dark ? "bg-sf-inverse text-sf-inverse-foreground" : "bg-sf-well text-sf-ink",
        className,
      )}
    >
      {/* The chapter's accessible name. Beat headings below are h3s under it,
          so the document outline stays h1 > h2 > h3 across the whole story. */}
      <h2 id={`${id}-heading`} className="sr-only">
        {name}
      </h2>

      <div
        className="sf-track"
        style={{ "--beats": beats.length } as React.CSSProperties}
      >
        <div className="sf-stage">
          {beats.map((beat, i) => (
            <article
              key={i}
              // The beat itself never changes opacity. Its media and its copy
              // are animated independently — see the note in globals.css on
              // why a dissolve that is right for photographs is wrong for
              // headlines. The chapter ground comes from the section, so a
              // beat stays transparent and nothing occludes anything.
              className="sf-beat"
              style={beatRange(i, beats.length)}
              {...(i === 0 ? { "data-first": "" } : { "data-reveal": "" })}
              {...(i === beats.length - 1 ? { "data-last": "" } : {})}
              {...(isPanel ? {} : { "data-full": "" })}
            >
              {isPanel ? (
                // The still runs to the frame edge, the copy sits on the
                // chapter ground beside it. Image first in source order, so
                // in RTL it takes the start (right) side — the mirror of the
                // opening frame, which keeps the two from reading as one
                // template used twice.
                <div className="grid h-full w-full grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-1">
                  <div className={cn("sf-shot relative h-full min-h-0", grade && "sf-grade")}>
                    <StoreImage
                      src={beat.image}
                      alt={beat.alt}
                      className="h-full w-full"
                      sizes="(min-width: 1024px) 54vw, 100vw"
                      priority={priority && i === 0}
                      transformWidth={1400}
                      quality={80}
                      objectPosition={beat.imagePosition}
                    />
                  </div>
                  <div className="sf-beat-copy flex flex-col justify-center px-5 pt-6 pb-16 md:px-10 md:pt-8 md:pb-20 lg:px-14 lg:py-20 xl:px-20">
                    <BeatCopy beat={beat} inverse={dark} display />
                  </div>
                </div>
              ) : (
                <>
                  <div className="sf-beat-media">
                    <StoreImage
                      src={beat.image}
                      alt={beat.alt}
                      className="h-full w-full"
                      sizes="100vw"
                      priority={priority && i === 0}
                      transformWidth={1800}
                      quality={82}
                    />
                    <div className="sf-scrim" aria-hidden="true" />
                  </div>
                  <div className="sf-beat-copy mx-auto flex h-full w-full max-w-[1320px] flex-col justify-end px-5 pb-14 md:px-8 md:pb-20 lg:px-12">
                    <div className="max-w-2xl">
                      <BeatCopy beat={beat} inverse />
                    </div>
                  </div>
                </>
              )}
            </article>
          ))}

          {/* Slate and progress rule live on the frame, not on a beat, so
              they persist across the dissolves instead of flickering with
              each one. In the panel layout they sit at the foot of the copy
              column — never over the photograph. `[grid-area:1/1]` keeps
              them in the beats' cell rather than an implicit second row. */}
          <div
            className={cn(
              "pointer-events-none relative z-[2] grid w-full self-end [grid-area:1/1]",
              isPanel
                ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
                : "mx-auto max-w-[1320px] self-start",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-4",
                isPanel
                  ? "px-5 pb-6 md:px-10 md:pb-8 lg:col-start-2 lg:px-14 lg:pb-12 xl:px-20"
                  : "px-5 pt-8 md:px-8 md:pt-10 lg:px-12",
              )}
            >
              <span className="sf-slate shrink-0">{name}</span>
              <span className={cn("h-px flex-1 overflow-hidden", dark ? "bg-sf-inverse-rule" : "bg-sf-ink/15")}>
                <span className="sf-progress bg-primary block h-px w-full" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BeatCopy({
  beat,
  inverse,
  display = false,
}: {
  beat: ChapterBeat;
  inverse?: boolean;
  /** Set the title at display scale — a department name, not a sentence. */
  display?: boolean;
}) {
  return (
    <>
      {beat.eyebrow && (
        <p
          className={cn(
            "mb-4 text-[0.8125rem] font-semibold md:mb-5",
            inverse ? "text-primary" : "text-sf-accent",
          )}
        >
          {beat.eyebrow}
        </p>
      )}
      <h3
        className={cn(
          display ? "sf-display" : "sf-title",
          inverse ? "text-sf-inverse-foreground" : "text-sf-ink",
        )}
      >
        {beat.title}
      </h3>
      {beat.body && (
        <p
          className={cn(
            "mt-4 max-w-md text-[1.0625rem] leading-relaxed md:mt-6 md:text-lg",
            inverse ? "text-sf-inverse-muted" : "text-muted-foreground",
          )}
        >
          {beat.body}
        </p>
      )}
      {beat.footer && <div className="mt-7 md:mt-10">{beat.footer}</div>}
    </>
  );
}
