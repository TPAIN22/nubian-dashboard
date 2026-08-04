import type {
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  QueueShortName,
} from './types'

export const NOTIFICATION_QUERY_KEY = ['notifications'] as const

/**
 * Poll intervals for the notification/queue console.
 *
 * The queue views are billed in Redis commands, not just HTTP requests:
 * `queueStats` fans out to one Lua call per queue (5), and `failedJobs` costs a
 * range read plus *one HGETALL per row on the page* — ~27 Redis commands per
 * tick at a full 25-row page. On a 5s/10s timer that was ~320k commands a day
 * from one admin tab left open, dwarfing real traffic.
 *
 * So the two queue views no longer poll at all. Both already have an explicit
 * refresh button, and both refetch on window focus — you get fresh numbers
 * whenever you actually look at the page, and nothing is spent when you don't.
 * A background tab is free.
 *
 * The Mongo-backed views (notifications, analytics) don't touch Redis, so they
 * keep their timers.
 */
export const POLLING_INTERVALS = {
  queueStats: false,
  failedJobs: false,
  notifications: 30_000,
  analytics: 60_000,
} as const

export const STATUS_LABELS: Record<NotificationStatus, string> = {
  pending: 'Pending',
  queued: 'Queued',
  retrying: 'Retrying',
  sent: 'Sent',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  transactional: 'Transactional',
  merchant_alerts: 'Merchant alerts',
  behavioral: 'Behavioral',
  marketing: 'Marketing',
  system: 'System',
}

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: 'Push',
  in_app: 'In-app',
  sms: 'SMS',
  email: 'Email',
}

export const QUEUE_LABELS: Record<QueueShortName, string> = {
  push: 'Push',
  email: 'Email',
  sms: 'SMS',
  fanout: 'Fanout',
  maintenance: 'Maintenance',
}

export const QUEUE_DESCRIPTIONS: Record<QueueShortName, string> = {
  push: 'Mobile push delivery via Expo',
  email: 'Transactional + marketing email via Resend',
  sms: 'SMS delivery channel',
  fanout: 'Splits broadcasts into per-recipient jobs',
  maintenance: 'Cron-driven cleanup, DLQ sweep, token cleanup',
}

export const QUEUE_SHORT_NAMES: QueueShortName[] = [
  'push',
  'email',
  'sms',
  'fanout',
  'maintenance',
]

export const NOTIFICATION_TYPES: Array<{
  value: NotificationType
  label: string
  category: NotificationCategory
}> = [
  { value: 'NEW_ARRIVALS', label: 'New arrivals', category: 'marketing' },
  { value: 'FLASH_SALE', label: 'Flash sale', category: 'marketing' },
  { value: 'MERCHANT_PROMOTION', label: 'Merchant promotion', category: 'marketing' },
  { value: 'PERSONALIZED_OFFER', label: 'Personalized offer', category: 'marketing' },
  { value: 'SYSTEM_ANNOUNCEMENT', label: 'System announcement', category: 'system' },
]

export const STATUS_TONE: Record<
  NotificationStatus,
  'success' | 'warning' | 'danger' | 'info' | 'muted'
> = {
  pending: 'info',
  queued: 'info',
  retrying: 'warning',
  sent: 'success',
  delivered: 'success',
  failed: 'danger',
  cancelled: 'muted',
}

export const CATEGORY_TONE: Record<
  NotificationCategory,
  'success' | 'warning' | 'danger' | 'info' | 'muted'
> = {
  transactional: 'success',
  merchant_alerts: 'warning',
  behavioral: 'info',
  marketing: 'info',
  system: 'muted',
}
