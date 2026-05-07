export type NotificationChannel = 'push' | 'in_app' | 'sms' | 'email'

export type NotificationStatus =
  | 'pending'
  | 'queued'
  | 'retrying'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled'

export type NotificationCategory =
  | 'transactional'
  | 'merchant_alerts'
  | 'behavioral'
  | 'marketing'
  | 'system'

export type NotificationRecipientType = 'user' | 'merchant' | 'admin' | 'all'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical'

export type NotificationType =
  | 'NEW_ARRIVALS'
  | 'FLASH_SALE'
  | 'MERCHANT_PROMOTION'
  | 'PERSONALIZED_OFFER'
  | 'ORDER_CREATED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'WELCOME'
  | 'SYSTEM_ANNOUNCEMENT'
  | (string & {})

export interface NotificationRecord {
  _id: string
  type: NotificationType
  recipientType: NotificationRecipientType
  recipientId?: string
  title: string
  body: string
  channel: NotificationChannel
  status: NotificationStatus
  category: NotificationCategory
  priority?: NotificationPriority
  isRead: boolean
  attempts?: number
  lastError?: string
  lastAttemptAt?: string
  sentAt?: string
  deliveredAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt?: string
  deepLink?: string
  metadata?: Record<string, unknown>
}

export interface NotificationListMeta {
  total?: number
  limit: number
  offset: number
  hasMore?: boolean
}

export interface NotificationListResponse {
  notifications: NotificationRecord[]
  meta: NotificationListMeta
}

export interface NotificationFilters {
  search?: string
  category?: NotificationCategory | 'all'
  status?: NotificationStatus | 'all'
  channel?: NotificationChannel | 'all'
  type?: string
  recipientType?: NotificationRecipientType | 'all'
  from?: string
  to?: string
  limit: number
  offset: number
  sort?: 'createdAt' | 'sentAt' | 'status'
  order?: 'asc' | 'desc'
}

export interface NotificationPreferences {
  channels: {
    push: boolean
    in_app: boolean
    sms: boolean
    email: boolean
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
    timezone: string
  }
  rateLimiting: {
    enabled: boolean
    maxPerHour: number
    maxPerDay: number
  }
  antiSpam: {
    enabled: boolean
    minIntervalBetweenSameType: number
  }
}

export type QueueShortName = 'push' | 'email' | 'sms' | 'fanout' | 'maintenance'

export interface QueueJobCounts {
  waiting: number
  active: number
  delayed: number
  failed: number
  completed: number
  paused: number
}

export interface QueueStat {
  name: string
  counts?: QueueJobCounts
  error?: string
}

export type QueueStatsMap = Record<QueueShortName, QueueStat>

export interface FailedJob {
  id: string
  name: string
  attemptsMade: number
  maxAttempts?: number
  failedReason?: string
  stacktrace?: string[] | null
  timestamp: number
  finishedOn?: number
  dataPreview?: Record<string, unknown>
}

export interface FailedJobsResponse {
  jobs: FailedJob[]
  meta: { queue: string; limit: number; offset: number; total: number }
}

export type ComposeMode = 'broadcast' | 'marketing'
export type ComposeTarget = 'all' | 'users' | 'merchants' | 'specific'

export interface ComposePayload {
  mode: ComposeMode
  type: NotificationType
  title: string
  body: string
  deepLink?: string
  target: ComposeTarget
  recipientIds?: string[]
  metadata?: Record<string, unknown>
}

export interface ComposeResponse {
  status?: 'processing' | 'sent'
  sent?: number
  queued?: boolean
}

export interface AnalyticsBucket {
  date: string
  sent: number
  failed: number
  queued: number
}

export interface NotificationAnalytics {
  totals: {
    sent: number
    failed: number
    queued: number
    delivered: number
  }
  deliveryRate: number
  failureRate: number
  series: AnalyticsBucket[]
  byChannel: Array<{ channel: NotificationChannel; count: number }>
  byCategory: Array<{ category: NotificationCategory; count: number }>
}
