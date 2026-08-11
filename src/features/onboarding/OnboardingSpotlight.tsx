'use client'

import * as React from 'react'

import type { Rect } from './position'

/* ============================================================================
   Spotlight
   ----------------------------------------------------------------------------
   One full-screen SVG: a dim wash with a rounded hole punched through it by a
   mask, plus a hairline brand ring around the hole. A mask rather than four
   dividing <div>s because it gives real rounded corners and animates as one
   shape instead of four rectangles racing each other.

   `pointer-events: none` on the whole layer, deliberately. The brief asks that
   the tour not block the dashboard and that clicking the highlighted Products
   row actually navigate to Products — both of which mean clicks have to reach
   the page. So this is a lighting change, not a modal: the popover is the only
   part of the tour that takes input.
   ========================================================================== */

/** Breathing room between the highlighted element and the edge of the hole. */
const PAD = 6
const RADIUS = 8

export function OnboardingSpotlight({
  rect,
  reducedMotion,
}: {
  rect: Rect | null
  reducedMotion: boolean
}) {
  const id = React.useId()
  const maskId = `onboarding-mask-${id}`

  const hole = rect
    ? {
        x: rect.left - PAD,
        y: rect.top - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null

  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      // Painted straight into viewport pixels, which is exactly what
      // getBoundingClientRect hands us — no conversion, nothing to get wrong.
      width="100%"
      height="100%"
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {hole && (
            <rect
              x={hole.x}
              y={hole.y}
              width={hole.width}
              height={hole.height}
              rx={RADIUS}
              fill="black"
              style={
                reducedMotion
                  ? undefined
                  : { transition: 'x 180ms ease-out, y 180ms ease-out, width 180ms ease-out, height 180ms ease-out' }
              }
            />
          )}
        </mask>
      </defs>

      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        // Light enough to read the dashboard through, dark enough that the
        // highlighted element is unmistakably the subject.
        fill="rgb(9 9 11 / 0.5)"
        mask={`url(#${maskId})`}
      />

      {hole && (
        <rect
          x={hole.x}
          y={hole.y}
          width={hole.width}
          height={hole.height}
          rx={RADIUS}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="1.5"
          style={
            reducedMotion
              ? undefined
              : { transition: 'x 180ms ease-out, y 180ms ease-out, width 180ms ease-out, height 180ms ease-out' }
          }
        />
      )}
    </svg>
  )
}
