import logger from '@/lib/logger'
import type { OnboardingEvent } from './types'

/* ============================================================================
   Onboarding events
   ----------------------------------------------------------------------------
   The dashboard has no analytics provider — no GA4 wrapper, no PostHog, no
   event bus. Rather than install one on the back of an onboarding ticket, the
   tour emits through the logger the app already has, plus a plain
   `CustomEvent` on `window`.

   That gives whoever wires up analytics later exactly one place to subscribe:

       window.addEventListener('nubian:analytics', (e) => provider.track(
         e.detail.event, e.detail.properties,
       ))

   …and it costs zero dependencies today.
   ========================================================================== */

export const ANALYTICS_EVENT = 'nubian:analytics'

export type OnboardingEventPayload = {
  event: OnboardingEvent
  properties: {
    /** Clerk user id — the identifier the rest of the platform keys on. */
    userId?: string | null
    /** Which tour. Without it, two tours' funnels arrive as one. */
    tourId?: string
    stepId?: string | null
    stepIndex?: number
    stepTotal?: number
    [key: string]: unknown
  }
}

export function trackOnboarding(
  event: OnboardingEvent,
  properties: OnboardingEventPayload['properties'] = {},
): void {
  const payload: OnboardingEventPayload = { event, properties }

  logger.debug(`onboarding: ${event}`, properties)

  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT, { detail: payload }))
  } catch {
    /* an event that fails to dispatch must never break the tour */
  }
}
