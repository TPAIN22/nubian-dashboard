'use client'

import { useAuth } from '@clerk/nextjs'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { notificationsApi, queuesApi } from './api'
import { POLLING_INTERVALS } from './constants'
import type {
  ComposePayload,
  ComposeResponse,
  NotificationFilters,
  NotificationPreferences,
  QueueShortName,
} from './types'

const useToken = () => {
  const { getToken, isSignedIn } = useAuth()
  return useMemo(
    () => async () => {
      if (!isSignedIn) return null
      return getToken()
    },
    [getToken, isSignedIn],
  )
}

const surfaceError = (error: unknown, fallback: string) => {
  const anyErr = error as any
  const message =
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error?.message ||
    anyErr?.message ||
    fallback
  toast.error(fallback, { description: message })
}

/* -------------------------- queries -------------------------- */

export const useNotifications = (filters: NotificationFilters) => {
  const token = useToken()
  return useQuery({
    queryKey: ['notifications', 'list', filters],
    placeholderData: keepPreviousData,
    refetchInterval: POLLING_INTERVALS.notifications,
    queryFn: async () => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      return notificationsApi.list(t, filters)
    },
  })
}

export const usePreferences = () => {
  const token = useToken()
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: async () => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      return notificationsApi.getPreferences(t)
    },
  })
}

export const useQueueStats = (enabled = true) => {
  const token = useToken()
  return useQuery({
    queryKey: ['notifications', 'queues', 'stats'],
    enabled,
    refetchInterval: POLLING_INTERVALS.queueStats,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      return queuesApi.stats(t)
    },
  })
}

export const useFailedJobs = (
  queue: QueueShortName,
  pagination: { limit: number; offset: number },
) => {
  const token = useToken()
  return useQuery({
    queryKey: ['notifications', 'queues', queue, 'failed', pagination],
    placeholderData: keepPreviousData,
    refetchInterval: POLLING_INTERVALS.failedJobs,
    queryFn: async () => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      return queuesApi.failed(t, queue, pagination)
    },
  })
}

/* -------------------------- mutations -------------------------- */

export const useUpdatePreferences = () => {
  const token = useToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      return notificationsApi.updatePreferences(t, prefs)
    },
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ['notifications', 'preferences'] })
      const previous = qc.getQueryData<NotificationPreferences | null>([
        'notifications',
        'preferences',
      ])
      qc.setQueryData(['notifications', 'preferences'], next)
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(['notifications', 'preferences'], ctx.previous)
      }
      surfaceError(err, 'Failed to save preferences')
    },
    onSuccess: () => {
      toast.success('Preferences saved')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] })
    },
  })
}

export const useCompose = (onComplete?: (res: ComposeResponse) => void) => {
  const token = useToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ComposePayload) => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      return notificationsApi.compose(t, payload)
    },
    onSuccess: (res, payload) => {
      const label = payload.mode === 'broadcast' ? 'Broadcast' : 'Marketing campaign'
      if (typeof res.sent === 'number') {
        toast.success(`${label} dispatched`, {
          description: `Delivered to ${res.sent} recipient${res.sent === 1 ? '' : 's'}.`,
        })
      } else if (res.queued || res.status === 'processing') {
        toast.success(`${label} queued`, {
          description: 'Recipients are being processed in the background.',
        })
      } else {
        toast.success(`${label} dispatched`)
      }
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] })
      qc.invalidateQueries({ queryKey: ['notifications', 'queues'] })
      onComplete?.(res)
    },
    onError: (err) => surfaceError(err, 'Failed to dispatch notification'),
  })
}

export const useMarkRead = () => {
  const token = useToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      await notificationsApi.markRead(t, id)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] })
    },
    onError: (err) => surfaceError(err, 'Failed to mark notification as read'),
  })
}

export const useRetryJobs = (queue: QueueShortName) => {
  const token = useToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      return queuesApi.retry(t, queue, ids)
    },
    onSuccess: (data) => {
      const failures = data.errors?.length ?? 0
      toast.success(`Retry submitted`, {
        description: `${data.retried} job${data.retried === 1 ? '' : 's'} requeued${failures ? `, ${failures} failed` : ''}.`,
      })
      qc.invalidateQueries({ queryKey: ['notifications', 'queues'] })
    },
    onError: (err) => surfaceError(err, 'Failed to retry jobs'),
  })
}

export const useDrainJobs = (queue: QueueShortName) => {
  const token = useToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (olderThanDays: number) => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      return queuesApi.drain(t, queue, olderThanDays)
    },
    onSuccess: (data) => {
      toast.success('Drain complete', {
        description: `${data.removed} job${data.removed === 1 ? '' : 's'} removed (scanned ${data.scanned}).`,
      })
      qc.invalidateQueries({ queryKey: ['notifications', 'queues'] })
    },
    onError: (err) => surfaceError(err, 'Failed to drain failed jobs'),
  })
}

export const useSendTest = () => {
  const token = useToken()
  return useMutation({
    mutationFn: async (payload: { type: string; title: string; body: string; userId?: string }) => {
      const t = await token()
      if (!t) throw new Error('Authentication required')
      return notificationsApi.sendTest(t, payload)
    },
    onSuccess: () => toast.success('Test notification sent'),
    onError: (err) => surfaceError(err, 'Failed to send test notification'),
  })
}
