'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

import { computePosition, resolvePlacement, type Rect, type Side } from './position'
import { OnboardingCard, type OnboardingCardProps } from './OnboardingCard'
import type { StepPlacement } from './types'

/* ============================================================================
   Anchored popover
   ----------------------------------------------------------------------------
   Portalled to <body> because the console shell's root is `overflow-hidden`
   and a fixed child of an overflow/transform ancestor is clipped by it — the
   popover would disappear the moment it reached past the rail.

   It measures itself before it decides where to sit. A card whose height
   depends on two lines of Arabic cannot be placed from a guess, so the first
   paint is `visibility: hidden`, the ResizeObserver reports the real size, and
   the second paint lands in the right place. That is one frame, not a jump.
   ========================================================================== */

const WIDTH = 320

export function OnboardingPopover({
  targetRect,
  placement,
  dir,
  reducedMotion,
  onKeyDown,
  labelledBy,
  describedBy,
  focusKey,
  ...card
}: OnboardingCardProps & {
  targetRect: Rect
  placement: StepPlacement | undefined
  dir: 'rtl' | 'ltr'
  reducedMotion: boolean
  onKeyDown: (e: React.KeyboardEvent) => void
  labelledBy: string
  describedBy: string
  /** Changing this moves focus onto the card — one focus move per step. */
  focusKey: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null)
  const [viewport, setViewport] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const read = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize((prev) =>
        prev && Math.abs(prev.height - r.height) < 0.5 && Math.abs(prev.width - r.width) < 0.5
          ? prev
          : { width: r.width, height: r.height },
      )
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // One focus move per step, onto the card itself rather than its first button:
  // landing on "التالي" would read the button before the sentence explaining it.
  React.useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [focusKey])

  const preferred: Side = resolvePlacement(placement, dir)

  const solved =
    size && viewport.width > 0
      ? computePosition({ target: targetRect, popover: size, viewport, preferred })
      : null

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      // Not `aria-modal`: the tour deliberately leaves the dashboard usable
      // underneath, and claiming modality would tell a screen reader the rest
      // of the page is inert when it is not.
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{
        position: 'fixed',
        width: WIDTH,
        maxWidth: 'calc(100vw - 24px)',
        top: solved?.top ?? 0,
        left: solved?.left ?? 0,
        visibility: solved ? 'visible' : 'hidden',
        boxShadow: 'var(--elev-dialog)',
        transition: reducedMotion ? undefined : 'top 180ms ease-out, left 180ms ease-out',
      }}
      className={cn(
        'z-[60] rounded-lg border border-border bg-popover p-3.5 outline-none',
        !reducedMotion && 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150',
      )}
    >
      {solved && <Arrow side={solved.side} offset={solved.arrow} />}
      <OnboardingCard {...card} />
    </div>,
    document.body,
  )
}

/* -------------------------------------------------------------------------- */

/**
 * A rotated square sharing the card's border and surface, so it reads as the
 * card's own corner rather than a separate triangle sitting next to it. Which
 * two edges keep their border depends on which way it points.
 */
function Arrow({ side, offset }: { side: Side; offset: number }) {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 9,
    height: 9,
    transform: 'rotate(45deg)',
    background: 'var(--popover)',
  }

  const style: React.CSSProperties =
    side === 'bottom'
      ? { ...base, top: -5, left: offset - 4.5, borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }
      : side === 'top'
        ? { ...base, bottom: -5, left: offset - 4.5, borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }
        : side === 'right'
          ? { ...base, left: -5, top: offset - 4.5, borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }
          : { ...base, right: -5, top: offset - 4.5, borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)' }

  return <span aria-hidden style={style} />
}
