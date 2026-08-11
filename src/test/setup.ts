/**
 * Shared test setup.
 *
 * Only the browser APIs jsdom does not implement and the onboarding tour needs
 * to run: it measures elements, watches for resizes, and asks about motion
 * preferences. Without these the components throw before a single assertion.
 * Node-environment tests load this file too and are unaffected — every stub is
 * guarded on `window` existing.
 */

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  }

  if (!globalThis.ResizeObserver) {
    // Fires once on observe. A no-op stub would leave any component that waits
    // for its own measured size stuck at `visibility: hidden`, which then hides
    // it from role queries and makes every such test look like a render bug.
    globalThis.ResizeObserver = class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ target } as unknown as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        )
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }

  // jsdom lays nothing out, so every rect is zero — and the tour reads a
  // zero-size rect as "this element is not really on screen". Tests that care
  // about a spotlight stub `getBoundingClientRect` on the specific node.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }

  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 16) as unknown as number) as typeof requestAnimationFrame
    globalThis.cancelAnimationFrame = ((id: number) =>
      clearTimeout(id as unknown as NodeJS.Timeout)) as typeof cancelAnimationFrame
  }
}
