import type { StepPlacement } from './types'

/* ============================================================================
   Popover placement
   ----------------------------------------------------------------------------
   Pure geometry, no DOM. Radix's Popover would have done most of this, but it
   anchors to a React child and the tour's anchors are elements it does not own
   and does not render — a nav row three components away, a button on a page
   that has not mounted yet. So the maths lives here, where it can be asserted
   against a fake viewport instead of a browser.

   Everything is in viewport coordinates, because that is what
   `getBoundingClientRect` returns and what `position: fixed` consumes.
   ========================================================================== */

export type Rect = { top: number; left: number; width: number; height: number }
export type Size = { width: number; height: number }
export type Side = 'top' | 'bottom' | 'left' | 'right'

export type Placement = {
  top: number
  left: number
  side: Side
  /** Arrow offset along the popover's cross axis, in px from its top/left edge. */
  arrow: number
}

/** Gap between the highlighted element and the popover. */
export const GAP = 12
/** Minimum breathing room from the viewport edge. */
export const MARGIN = 12
const ARROW_INSET = 16

/**
 * Logical placement → physical side.
 *
 * The steps declare `inline-end` and the rail is on the RIGHT in Arabic, so in
 * RTL that resolves to `left`. Hard-coding "left" in the step list instead
 * would put every sidebar popover off-screen the moment somebody previews the
 * console in English.
 */
export function resolvePlacement(
  placement: StepPlacement | undefined,
  dir: 'rtl' | 'ltr',
): Side {
  switch (placement) {
    case 'block-start':
      return 'top'
    case 'block-end':
      return 'bottom'
    case 'inline-start':
      return dir === 'rtl' ? 'right' : 'left'
    case 'inline-end':
      return dir === 'rtl' ? 'left' : 'right'
    default:
      return 'bottom'
  }
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

function place(target: Rect, popover: Size, side: Side): { top: number; left: number } {
  switch (side) {
    case 'top':
      return {
        top: target.top - popover.height - GAP,
        left: target.left + target.width / 2 - popover.width / 2,
      }
    case 'bottom':
      return {
        top: target.top + target.height + GAP,
        left: target.left + target.width / 2 - popover.width / 2,
      }
    case 'left':
      return {
        top: target.top + target.height / 2 - popover.height / 2,
        left: target.left - popover.width - GAP,
      }
    case 'right':
      return {
        top: target.top + target.height / 2 - popover.height / 2,
        left: target.left + target.width + GAP,
      }
  }
}

function fits(
  pos: { top: number; left: number },
  popover: Size,
  viewport: Size,
): boolean {
  return (
    pos.top >= MARGIN &&
    pos.left >= MARGIN &&
    pos.top + popover.height <= viewport.height - MARGIN &&
    pos.left + popover.width <= viewport.width - MARGIN
  )
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/**
 * Where to put the popover so it points at the target and stays on screen.
 *
 * Tries the preferred side, then its opposite, then the perpendicular pair;
 * whichever fits first wins. If none fits — a narrow phone, a tall card — the
 * preferred side is used and the result is clamped into the viewport, which is
 * always better than a popover half off the edge.
 */
export function computePosition({
  target,
  popover,
  viewport,
  preferred,
}: {
  target: Rect
  popover: Size
  viewport: Size
  preferred: Side
}): Placement {
  const order: Side[] = [
    preferred,
    OPPOSITE[preferred],
    ...(preferred === 'top' || preferred === 'bottom'
      ? (['right', 'left'] as Side[])
      : (['bottom', 'top'] as Side[])),
  ]

  let side = preferred
  let pos = place(target, popover, preferred)
  for (const candidate of order) {
    const p = place(target, popover, candidate)
    if (fits(p, popover, viewport)) {
      side = candidate
      pos = p
      break
    }
  }

  const top = clamp(pos.top, MARGIN, Math.max(MARGIN, viewport.height - popover.height - MARGIN))
  const left = clamp(pos.left, MARGIN, Math.max(MARGIN, viewport.width - popover.width - MARGIN))

  // The arrow tracks the target's centre even after the card has been clamped,
  // so it keeps pointing at the thing being explained rather than at the middle
  // of wherever the card ended up.
  const horizontal = side === 'top' || side === 'bottom'
  const targetCentre = horizontal
    ? target.left + target.width / 2 - left
    : target.top + target.height / 2 - top
  const axis = horizontal ? popover.width : popover.height
  const arrow = clamp(targetCentre, ARROW_INSET, Math.max(ARROW_INSET, axis - ARROW_INSET))

  return { top, left, side, arrow }
}

/** True when the element sits far enough outside the viewport to need scrolling. */
export function needsScroll(target: Rect, viewport: Size): boolean {
  return (
    target.top < MARGIN ||
    target.left < MARGIN ||
    target.top + target.height > viewport.height - MARGIN ||
    target.left + target.width > viewport.width - MARGIN
  )
}
