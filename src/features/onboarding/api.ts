'use client'

import * as React from 'react'
import { useAuth } from '@clerk/nextjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import logger from '@/lib/logger'
import { merchantRequest, useMerchantProfile, useMerchantStats } from '@/features/merchant/api'

import { applyPatch, DEFAULT_STATE, normalizeState } from './state'
import { readSnapshot, writeSnapshot } from './storage'
import { TOUR_VERSION } from './steps'
import type { MerchantContext, OnboardingPatch, OnboardingState } from './types'

/* ============================================================================
   Onboarding data layer
   ----------------------------------------------------------------------------
   Two things live here: the merchant's tour progress (server-owned, cached
   locally) and the small amount of real evidence the tour needs to stop being
   generic — how many products they have, how many orders, whether the store
   profile is filled in.

   The evidence queries are gated on the tour actually being live. The console
   shell mounts on every merchant route, and the codebase already made the call
   that a full catalogue fetch is too expensive to run on the settings page just
   to compute a number. So nothing here fires for a merchant who finished or
   skipped the tour.
   ========================================================================== */

export const onboardingKeys = {
  state: (userId: string | null | undefined) => ['merchant', 'onboarding', userId] as const,
  productCount: ['merchant', 'onboarding', 'product-count'] as const,
}

const ENDPOINT = '/api/merchant/onboarding'

/** Unwraps `{ success, data }` while tolerating a handler that returns raw data. */
function unwrap(body: unknown): unknown {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: unknown }).data
  }
  return body
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

export type OnboardingStateQuery = {
  state: OnboardingState | null
  /**
   * We have a trustworthy answer. False while the request is in flight AND
   * false when it failed with no local snapshot to fall back on — see
   * `resolveEntry`, which refuses to open a tour it cannot account for.
   */
  loaded: boolean
  /** The server could not be reached; we are running on a cached answer or none. */
  degraded: boolean
}

export function useOnboardingState(): OnboardingStateQuery {
  const { userId, isLoaded: authLoaded } = useAuth()

  const query = useQuery<OnboardingState>({
    queryKey: onboardingKeys.state(userId),
    queryFn: async () => normalizeState(unwrap(await merchantRequest<unknown>(ENDPOINT))),
    enabled: Boolean(userId),
    // Nothing but this app changes it, and every change goes through the
    // mutation below — so refetching on window focus is pure noise.
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  // Read once per user rather than on every render: localStorage is synchronous
  // and this hook sits inside the shell that wraps every merchant route.
  const snapshot = React.useMemo(() => readSnapshot(userId), [userId])

  React.useEffect(() => {
    if (query.data) writeSnapshot(userId, query.data)
  }, [query.data, userId])

  React.useEffect(() => {
    if (query.isError) {
      logger.warn('onboarding: could not load tour progress', {
        message: (query.error as Error | null)?.message,
        usingSnapshot: snapshot !== null,
      })
    }
  }, [query.isError, query.error, snapshot])

  if (!authLoaded || !userId) return { state: null, loaded: false, degraded: false }

  if (query.isSuccess) {
    return { state: query.data, loaded: true, degraded: false }
  }

  if (query.isError) {
    // A cached answer is better than no answer: it is right for this device and
    // it is the only thing standing between a merchant who already finished the
    // tour and seeing it again because the API blipped.
    return { state: snapshot, loaded: snapshot !== null, degraded: true }
  }

  return { state: null, loaded: false, degraded: false }
}

/**
 * Persists a partial update.
 *
 * Optimistic, and deliberately without a rollback. By the time a save fails the
 * merchant has already read the next step; yanking the popover back to where it
 * was would be a stranger experience than a server that is briefly behind. The
 * local snapshot carries the change across a reload on this device, and the
 * next successful write reconciles everything.
 */
export function useSaveOnboarding() {
  const qc = useQueryClient()
  const { userId } = useAuth()
  const key = onboardingKeys.state(userId)

  return useMutation({
    mutationFn: (patch: OnboardingPatch) =>
      merchantRequest<unknown>(ENDPOINT, { method: 'PUT', body: JSON.stringify(patch) }),

    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<OnboardingState>(key)
      const next = applyPatch(previous ?? { ...DEFAULT_STATE, version: TOUR_VERSION }, patch)
      qc.setQueryData(key, next)
      writeSnapshot(userId, next)
      return { previous }
    },

    onSuccess: (body) => {
      const server = normalizeState(unwrap(body))
      qc.setQueryData(key, server)
      writeSnapshot(userId, server)
    },

    onError: (error: Error) => {
      // Logged for us, invisible to the merchant. There is no user-facing
      // recovery for "your tooltip position did not save".
      logger.error('onboarding: failed to save tour progress', { message: error.message })
    },

    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })
}

/* -------------------------------------------------------------------------- */
/* Evidence                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * How many products the store has, in one row.
 *
 * `useMerchantProducts` walks the whole catalogue a hundred at a time because
 * the products page filters client-side. The tour only needs to know whether
 * the number is zero, so it asks for a single row and reads the pagination
 * total — one request, one document, on a shell that mounts everywhere.
 */
function useMerchantProductCount(enabled: boolean) {
  return useQuery<number>({
    queryKey: onboardingKeys.productCount,
    queryFn: async () => {
      const body = await merchantRequest<{
        data?: unknown[]
        meta?: { pagination?: { total?: number } }
      }>('/api/products/merchant/my-products?page=1&limit=1')
      return body?.meta?.pagination?.total ?? (Array.isArray(body?.data) ? body.data.length : 0)
    },
    enabled,
    staleTime: 15_000,
    retry: 1,
  })
}

/**
 * What the tour knows about this merchant's actual situation.
 *
 * `ready` gates every "should this step be skipped" decision, so a slow query
 * can only delay a step — never silently drop one.
 */
export function useMerchantContext(enabled: boolean): MerchantContext {
  const profile = useMerchantProfile({ enabled })
  // Already fetched by the shell for the sidebar's pending-orders badge, so on
  // a merchant route this costs nothing extra.
  const stats = useMerchantStats({ enabled })
  const products = useMerchantProductCount(enabled)

  return React.useMemo(() => {
    if (!enabled) {
      return { ready: false, productCount: 0, orderCount: 0, storeConfigured: false }
    }

    // Settled, not successful: a failed evidence query must not hold the tour
    // hostage. It falls back to the zero-state copy, which is merely generic —
    // whereas waiting forever would mean the tour never opens at all.
    const ready = !profile.isPending && !stats.isPending && !products.isPending

    const p = profile.data
    return {
      ready,
      productCount: products.data ?? 0,
      orderCount: stats.data?.totalOrders ?? 0,
      // "Somebody has been here": a description plus at least one image is the
      // difference between a store that was set up and one that was created.
      storeConfigured: Boolean(p?.description && (p?.logoUrl || p?.banner)),
      storeName: p?.storeName,
    }
  }, [
    enabled,
    profile.isPending,
    profile.data,
    stats.isPending,
    stats.data,
    products.isPending,
    products.data,
  ])
}

/** Re-reads the product count — used when the merchant leaves the wizard. */
export function useRefreshProductCount() {
  const qc = useQueryClient()
  return React.useCallback(() => {
    qc.invalidateQueries({ queryKey: onboardingKeys.productCount })
  }, [qc])
}
