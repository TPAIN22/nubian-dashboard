import { normalizeStateMap } from './state'
import type { OnboardingStateMap } from './types'

/* ============================================================================
   Local snapshot
   ----------------------------------------------------------------------------
   An OPTIMIZATION, never the source of truth. The server owns onboarding state
   so it follows a merchant to a second device; this cache exists so the tour
   does not flash open for a beat on every navigation while the request lands,
   and so a merchant on a flaky connection is not shown a tour they already
   dismissed.

   Namespaced per Clerk user. On a shared machine — a shop counter with one
   browser and two staff logins is not hypothetical — a single key would hand
   one person's progress to the next.
   ========================================================================== */

const PREFIX = 'nubian.merchant.onboarding'

const keyFor = (userId: string) => `${PREFIX}.${userId}`

export function readSnapshot(userId: string | null | undefined): OnboardingStateMap | null {
  if (!userId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(keyFor(userId))
    if (!raw) return null
    return normalizeStateMap(JSON.parse(raw))
  } catch {
    // Private mode, quota, or a value from an older build. Either way the
    // server answer is authoritative — behave as if there were no cache.
    return null
  }
}

export function writeSnapshot(
  userId: string | null | undefined,
  state: OnboardingStateMap,
): void {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(state))
  } catch {
    /* nothing here is worth failing a render over */
  }
}

export function clearSnapshot(userId: string | null | undefined): void {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(keyFor(userId))
  } catch {
    /* see above */
  }
}
