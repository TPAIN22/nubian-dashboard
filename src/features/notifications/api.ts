import { axiosInstance } from '@/lib/axiosInstance'
import type {
  ComposePayload,
  ComposeResponse,
  FailedJobsResponse,
  NotificationFilters,
  NotificationListResponse,
  NotificationPreferences,
  QueueShortName,
  QueueStatsMap,
  NotificationRecord,
} from './types'

type AuthHeader = { Authorization: string }
const auth = (token: string): AuthHeader => ({ Authorization: `Bearer ${token}` })

const unwrap = <T,>(payload: any, fallback: T): T => {
  if (payload == null) return fallback
  if (payload?.data !== undefined) return payload.data as T
  return payload as T
}

export const notificationsApi = {
  async list(token: string, filters: NotificationFilters): Promise<NotificationListResponse> {
    const params = new URLSearchParams({
      limit: String(filters.limit),
      offset: String(filters.offset),
    })
    if (filters.category && filters.category !== 'all') params.set('category', filters.category)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    if (filters.channel && filters.channel !== 'all') params.set('channel', filters.channel)
    if (filters.recipientType && filters.recipientType !== 'all')
      params.set('recipientType', filters.recipientType)
    if (filters.type) params.set('type', filters.type)
    if (filters.search) params.set('search', filters.search)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.order) params.set('order', filters.order)

    const res = await axiosInstance.get(`/notifications?${params.toString()}`, {
      headers: auth(token),
    })

    const body = unwrap<any>(res.data, {})
    const list: NotificationRecord[] = Array.isArray(body?.notifications)
      ? body.notifications
      : Array.isArray(body)
        ? body
        : []
    const meta = body?.meta ?? {
      total: list.length,
      limit: filters.limit,
      offset: filters.offset,
    }
    return { notifications: list, meta }
  },

  async getPreferences(token: string): Promise<NotificationPreferences | null> {
    try {
      const res = await axiosInstance.get('/notifications/preferences', { headers: auth(token) })
      return unwrap<NotificationPreferences | null>(res.data, null)
    } catch (err: any) {
      if (err?.response?.status === 404) return null
      throw err
    }
  },

  async updatePreferences(
    token: string,
    prefs: NotificationPreferences,
  ): Promise<NotificationPreferences> {
    const res = await axiosInstance.put('/notifications/preferences', prefs, {
      headers: auth(token),
    })
    return unwrap<NotificationPreferences>(res.data, prefs)
  },

  async markRead(token: string, id: string): Promise<void> {
    await axiosInstance.patch(`/notifications/${id}/read`, undefined, { headers: auth(token) })
  },

  async markManyRead(token: string, ids: string[]): Promise<void> {
    await axiosInstance.post('/notifications/mark-read', { ids }, { headers: auth(token) })
  },

  async compose(token: string, payload: ComposePayload): Promise<ComposeResponse> {
    const endpoint = payload.mode === 'broadcast' ? '/notifications/broadcast' : '/notifications/marketing'

    const body: Record<string, unknown> = {
      type: payload.type,
      title: payload.title.trim(),
      body: payload.body.trim(),
      deepLink: payload.deepLink?.trim() || undefined,
      metadata: {
        sentBy: 'admin',
        timestamp: new Date().toISOString(),
        ...payload.metadata,
      },
    }

    if (payload.mode === 'broadcast') {
      body.target = payload.target === 'specific' ? 'all' : payload.target
    } else if (payload.target === 'specific' && payload.recipientIds?.length) {
      body.targetRecipients = payload.recipientIds
    }

    const res = await axiosInstance.post(endpoint, body, { headers: auth(token) })
    const data = unwrap<any>(res.data, {})
    return {
      status: data?.status,
      sent: typeof data?.sent === 'number' ? data.sent : undefined,
      queued: data?.status === 'processing',
    }
  },

  async sendTest(
    token: string,
    payload: { type: string; title: string; body: string; userId?: string },
  ): Promise<unknown> {
    const res = await axiosInstance.post('/notifications/test', payload, { headers: auth(token) })
    return unwrap<unknown>(res.data, null)
  },
}

export const queuesApi = {
  async stats(token: string): Promise<QueueStatsMap> {
    const res = await axiosInstance.get('/admin/queues/stats', { headers: auth(token) })
    return unwrap<QueueStatsMap>(res.data, {} as QueueStatsMap)
  },

  async failed(
    token: string,
    queue: QueueShortName,
    opts: { limit: number; offset: number },
  ): Promise<FailedJobsResponse> {
    const params = new URLSearchParams({
      limit: String(opts.limit),
      offset: String(opts.offset),
    })
    const res = await axiosInstance.get(`/admin/queues/${queue}/failed?${params}`, {
      headers: auth(token),
    })
    const data = unwrap<any>(res.data, [])
    const meta = res.data?.meta ?? { queue, limit: opts.limit, offset: opts.offset, total: 0 }
    return { jobs: Array.isArray(data) ? data : [], meta }
  },

  async retry(
    token: string,
    queue: QueueShortName,
    ids?: string[],
  ): Promise<{ retried: number; errors: Array<{ id: string; error: string }> }> {
    const res = await axiosInstance.post(
      `/admin/queues/${queue}/retry`,
      ids?.length ? { ids } : {},
      { headers: auth(token) },
    )
    return unwrap<any>(res.data, { retried: 0, errors: [] })
  },

  async drain(
    token: string,
    queue: QueueShortName,
    olderThanDays = 7,
  ): Promise<{ removed: number; scanned: number; olderThanDays: number }> {
    const res = await axiosInstance.post(
      `/admin/queues/${queue}/drain`,
      { olderThanDays },
      { headers: auth(token) },
    )
    return unwrap<any>(res.data, { removed: 0, scanned: 0, olderThanDays })
  },
}

/**
 * Subscribe to live notification events. Currently a no-op stub — the backend
 * does not expose a websocket yet. Wired so the UI is ready for it: callers
 * receive an unsubscribe fn and the rest of the app keeps polling.
 */
export const subscribeNotificationEvents = (
  _token: string,
  _onEvent: (event: { type: string; payload: unknown }) => void,
): (() => void) => {
  return () => {
    /* no-op until live transport ships */
  }
}
