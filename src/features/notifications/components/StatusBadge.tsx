import { CATEGORY_LABELS, CATEGORY_TONE, STATUS_LABELS, STATUS_TONE } from '../constants'
import type { NotificationCategory, NotificationStatus } from '../types'
import { ToneBadge } from './Tone'

export function NotificationStatusBadge({ status }: { status: NotificationStatus }) {
  return (
    <ToneBadge tone={STATUS_TONE[status] ?? 'muted'}>
      {STATUS_LABELS[status] ?? status}
    </ToneBadge>
  )
}

export function NotificationCategoryBadge({ category }: { category: NotificationCategory }) {
  return (
    <ToneBadge tone={CATEGORY_TONE[category] ?? 'muted'} withDot={false}>
      {CATEGORY_LABELS[category] ?? category}
    </ToneBadge>
  )
}
