import type { NotificationRecord, QueueJobCounts } from './types'

const dateFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export const formatDateTime = (input?: string | number | Date): string => {
  if (!input) return '—'
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return '—'
  return dateFmt.format(d)
}

export const formatRelativeTime = (input?: string | number | Date): string => {
  if (!input) return '—'
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const abs = Math.abs(diff)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  const sign = diff >= 0 ? 'ago' : 'from now'
  if (abs < minute) return 'just now'
  if (abs < hour) return `${Math.round(abs / minute)}m ${sign}`
  if (abs < day) return `${Math.round(abs / hour)}h ${sign}`
  if (abs < 7 * day) return `${Math.round(abs / day)}d ${sign}`
  return formatDateTime(d)
}

export const formatNumber = (value?: number | null): string => {
  if (value == null || Number.isNaN(value)) return '0'
  return new Intl.NumberFormat().format(value)
}

export const formatPercentage = (value: number, fractionDigits = 1): string => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '0%'
  return `${value.toFixed(fractionDigits)}%`
}

export const truncate = (value: string, max = 80): string =>
  value.length <= max ? value : `${value.slice(0, max)}…`

export const getQueueBacklog = (counts?: QueueJobCounts): number => {
  if (!counts) return 0
  return (counts.waiting ?? 0) + (counts.delayed ?? 0) + (counts.active ?? 0)
}

export const isFailedStatus = (status: NotificationRecord['status']): boolean =>
  status === 'failed' || status === 'retrying'

export const isInFlightStatus = (status: NotificationRecord['status']): boolean =>
  status === 'queued' || status === 'pending' || status === 'retrying'

export const dedupeById = <T extends { _id: string }>(items: T[]): T[] => {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    if (seen.has(item._id)) continue
    seen.add(item._id)
    out.push(item)
  }
  return out
}

export const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0]!)
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
