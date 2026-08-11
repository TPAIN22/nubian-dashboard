'use client'

import * as React from 'react'

import { needsScroll, type Rect } from './position'

/* ============================================================================
   Finding the thing being explained
   ----------------------------------------------------------------------------
   The tour anchors to `[data-onboarding="…"]`, never to a CSS path. A selector
   that reached through the sidebar's markup would break the first time somebody
   restyled a nav row; a data attribute is a contract.

   Three cases this has to survive, all of which happen in this dashboard:

     1. THE ELEMENT IS NOT THERE YET. Routes stream in, the products page mounts
        its header after the query resolves. So we keep looking rather than
        deciding once.

     2. THE ELEMENT IS THERE BUT INVISIBLE. Below `lg` the desktop rail is
        `hidden lg:block` — the nodes are in the DOM with a zero-size rect. A
        spotlight around a 0×0 box at the origin is worse than no spotlight, so
        zero-size counts as absent and the step falls back to a centred card.

     3. THERE ARE TWO OF IT. When the mobile drawer is open, the shell renders a
        second copy of the whole sidebar. We take the first one that is actually
        laid out.

   The rect is re-measured on a rAF loop while a step is live. That sounds
   expensive and is not: it is one `getBoundingClientRect` on a cached node,
   and state is only pushed when the numbers actually change. It is also the
   only thing that keeps the spotlight glued to a nav row through the sidebar's
   200ms collapse transition, which fires no scroll and no resize event.
   ========================================================================== */

export type TargetStatus = 'idle' | 'searching' | 'found' | 'missing'

/**
 * How long a target may stay absent before the step gives up and falls back to
 * a floating card.
 *
 * Short on purpose. An element that is on the page is found on the first frame,
 * so this budget is only ever spent when the target genuinely is not there —
 * and the tour paints nothing while it is still looking, to avoid flashing the
 * fallback card for a frame before the popover lands on top of it. Searching
 * continues after the deadline, so an element that shows up late still gets its
 * spotlight.
 */
const SEARCH_TIMEOUT_MS = 500

function findVisible(target: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-onboarding="${target}"]`)
  for (const node of nodes) {
    const r = node.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return node
  }
  return null
}

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5)

export function useTargetRect(target: string | undefined, active: boolean) {
  const [rect, setRect] = React.useState<Rect | null>(null)
  const [status, setStatus] = React.useState<TargetStatus>('idle')

  React.useEffect(() => {
    if (!active || !target || typeof window === 'undefined') {
      setRect(null)
      setStatus('idle')
      return
    }

    setStatus('searching')
    setRect(null)

    let frame = 0
    let node: HTMLElement | null = null
    let last: Rect | null = null
    let scrolled = false
    const startedAt = performance.now()
    let timedOut = false

    const tick = () => {
      // Re-query only when we have nothing or the node was unmounted — React
      // replaces these on navigation, and a detached node reports a stale rect.
      if (!node || !node.isConnected) node = findVisible(target)

      if (!node) {
        last = null
        setRect(null)
        if (!timedOut && performance.now() - startedAt > SEARCH_TIMEOUT_MS) {
          timedOut = true
          // Keep looking anyway: a merchant who opens the mobile drawer, or a
          // page that finishes loading, should get the spotlight back.
          setStatus('missing')
        }
        frame = requestAnimationFrame(tick)
        return
      }

      const r = node.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) {
        // Present but not laid out — the hidden desktop rail on a phone.
        node = null
        frame = requestAnimationFrame(tick)
        return
      }

      const next: Rect = { top: r.top, left: r.left, width: r.width, height: r.height }

      if (!scrolled) {
        scrolled = true
        if (needsScroll(next, { width: window.innerWidth, height: window.innerHeight })) {
          node.scrollIntoView({
            block: 'center',
            inline: 'center',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'auto'
              : 'smooth',
          })
        }
      }

      if (!sameRect(last, next)) {
        last = next
        setRect(next)
      }
      setStatus('found')
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active])

  return { rect, status }
}

/** Viewport size, tracked so the popover re-solves its placement on resize. */
export function useViewport() {
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const read = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  return size
}

/** Reads the document direction so placement can resolve `inline-*` correctly. */
export function useDirection(): 'rtl' | 'ltr' {
  // Starts at 'rtl' rather than 'ltr': the app's <html> is `dir="rtl"`, and
  // guessing the other way would flip every popover for one frame on mount.
  const [dir, setDir] = React.useState<'rtl' | 'ltr'>('rtl')

  React.useEffect(() => {
    const read = () =>
      setDir(document.documentElement.getAttribute('dir') === 'ltr' ? 'ltr' : 'rtl')
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] })
    return () => observer.disconnect()
  }, [])

  return dir
}
