import { describe, expect, it } from 'vitest'

import { computePosition, GAP, MARGIN, needsScroll, resolvePlacement } from './position'

/* ============================================================================
   Placement
   ----------------------------------------------------------------------------
   The RTL cases are the point. Arabic is the dashboard's first language and the
   rail sits on the RIGHT, so a popover that "goes after the target" has to come
   out on the left — get that backwards and every sidebar step lands off-screen.
   ========================================================================== */

const viewport = { width: 1280, height: 800 }
const popover = { width: 320, height: 180 }

describe('resolvePlacement', () => {
  it('mirrors the inline axis with the document direction', () => {
    expect(resolvePlacement('inline-end', 'rtl')).toBe('left')
    expect(resolvePlacement('inline-end', 'ltr')).toBe('right')
    expect(resolvePlacement('inline-start', 'rtl')).toBe('right')
    expect(resolvePlacement('inline-start', 'ltr')).toBe('left')
  })

  it('leaves the block axis alone — top is top in every direction', () => {
    expect(resolvePlacement('block-start', 'rtl')).toBe('top')
    expect(resolvePlacement('block-end', 'rtl')).toBe('bottom')
  })

  it('falls back to below the target', () => {
    expect(resolvePlacement(undefined, 'rtl')).toBe('bottom')
  })
})

describe('computePosition', () => {
  it('places a popover beside a sidebar row in RTL', () => {
    // The rail: 240px wide, hard against the right edge.
    const target = { top: 200, left: 1040, width: 224, height: 30 }
    const p = computePosition({ target, popover, viewport, preferred: 'left' })

    expect(p.side).toBe('left')
    expect(p.left).toBe(1040 - popover.width - GAP)
    // Vertically centred on the row.
    expect(p.top).toBe(200 + 15 - 90)
  })

  it('flips to the opposite side when the preferred one would go off-screen', () => {
    // Target hard against the left edge — there is no room on its left.
    const target = { top: 300, left: 4, width: 40, height: 30 }
    const p = computePosition({ target, popover, viewport, preferred: 'left' })
    expect(p.side).toBe('right')
  })

  it('flips a bottom-placed popover upward near the fold', () => {
    const target = { top: 740, left: 600, width: 120, height: 32 }
    const p = computePosition({ target, popover, viewport, preferred: 'bottom' })
    expect(p.side).toBe('top')
    expect(p.top).toBe(740 - popover.height - GAP)
  })

  it('clamps into the viewport when no side fits', () => {
    // A phone: no room beside the target on either hand.
    const phone = { width: 390, height: 700 }
    const target = { top: 250, left: 150, width: 20, height: 20 }
    const p = computePosition({ target, popover, viewport: phone, preferred: 'right' })

    expect(p.left).toBeGreaterThanOrEqual(MARGIN)
    expect(p.left + popover.width).toBeLessThanOrEqual(phone.width - MARGIN + 0.001)
    expect(p.top).toBeGreaterThanOrEqual(MARGIN)
  })

  it('keeps the arrow pointing at the target on whichever axis applies', () => {
    // Target hard against the right edge: the card is pushed inward, but the
    // arrow has to stay lined up with the thing being explained.
    const target = { top: 100, left: 1240, width: 30, height: 30 }
    const p = computePosition({ target, popover, viewport, preferred: 'bottom' })

    // `arrow` is an offset along the popover's CROSS axis, so which coordinate
    // it describes depends on the side the solver settled on.
    const horizontal = p.side === 'top' || p.side === 'bottom'
    const pointsAt = horizontal ? p.left + p.arrow : p.top + p.arrow
    const targetCentre = horizontal
      ? target.left + target.width / 2
      : target.top + target.height / 2

    expect(Math.abs(pointsAt - targetCentre)).toBeLessThan(20)
  })

  it('never lets the arrow escape the card', () => {
    const target = { top: 400, left: 0, width: 8, height: 8 }
    const p = computePosition({ target, popover, viewport, preferred: 'bottom' })
    expect(p.arrow).toBeGreaterThanOrEqual(0)
    expect(p.arrow).toBeLessThanOrEqual(popover.width)
  })
})

describe('needsScroll', () => {
  it('is false for an element comfortably in view', () => {
    expect(needsScroll({ top: 300, left: 300, width: 100, height: 40 }, viewport)).toBe(false)
  })

  it('is true for an element below the fold', () => {
    expect(needsScroll({ top: 900, left: 300, width: 100, height: 40 }, viewport)).toBe(true)
  })

  it('is true for an element scrolled off the top', () => {
    expect(needsScroll({ top: -40, left: 300, width: 100, height: 40 }, viewport)).toBe(true)
  })
})
