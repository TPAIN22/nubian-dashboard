/**
 * Status tones.
 *
 * One vocabulary for every status surface in the admin — badges, dots, alerts,
 * table cells, stat deltas. A domain status is mapped to a tone exactly once
 * (see `toneFor`), so "pending" looks identical whether it is on a merchant
 * application, an order, or a payout.
 */

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

/** Soft filled chip: tinted background + hairline + saturated text. */
export const toneChip: Record<Tone, string> = {
  neutral: 'bg-tone-neutral-bg text-tone-neutral-fg border-tone-neutral-border',
  success: 'bg-tone-success-bg text-tone-success-fg border-tone-success-border',
  warning: 'bg-tone-warning-bg text-tone-warning-fg border-tone-warning-border',
  danger: 'bg-tone-danger-bg text-tone-danger-fg border-tone-danger-border',
  info: 'bg-tone-info-bg text-tone-info-fg border-tone-info-border',
  brand: 'bg-tone-brand-bg text-tone-brand-fg border-tone-brand-border',
}

/** Text only — for inline emphasis and deltas. */
export const toneText: Record<Tone, string> = {
  neutral: 'text-tone-neutral-fg',
  success: 'text-tone-success-fg',
  warning: 'text-tone-warning-fg',
  danger: 'text-tone-danger-fg',
  info: 'text-tone-info-fg',
  brand: 'text-tone-brand-fg',
}

/** Solid 6px indicator dot. */
export const toneDot: Record<Tone, string> = {
  neutral: 'bg-tone-neutral-fg',
  success: 'bg-tone-success-fg',
  warning: 'bg-tone-warning-fg',
  danger: 'bg-tone-danger-fg',
  info: 'bg-tone-info-fg',
  brand: 'bg-tone-brand-fg',
}

/**
 * Canonical status → tone map.
 *
 * Keys cover the statuses used across merchants, orders, payments, products,
 * coupons, payouts and support tickets. Unknown values fall back to `neutral`
 * rather than throwing — new backend statuses degrade gracefully.
 */
const STATUS_TONES: Record<string, Tone> = {
  // lifecycle / approval
  approved: 'success',
  active: 'success',
  published: 'success',
  verified: 'success',
  completed: 'success',
  delivered: 'success',
  paid: 'success',
  resolved: 'success',
  open: 'info',

  pending: 'warning',
  processing: 'info',
  in_progress: 'info',
  needs_revision: 'warning',
  on_hold: 'warning',
  awaiting_payment: 'warning',
  awaiting_payment_confirmation: 'warning',
  pending_confirmation: 'warning',
  low_stock: 'warning',
  waiting_customer: 'warning',

  rejected: 'danger',
  cancelled: 'danger',
  canceled: 'danger',
  failed: 'danger',
  payment_failed: 'danger',
  refunded: 'danger',
  suspended: 'danger',
  out_of_stock: 'danger',
  expired: 'danger',
  disputed: 'danger',
  escalated: 'danger',
  resolved_rejected: 'danger',

  draft: 'neutral',
  archived: 'neutral',
  inactive: 'neutral',
  closed: 'neutral',
  unpaid: 'neutral',

  confirmed: 'info',
  shipped: 'info',
  out_for_delivery: 'info',
  under_review: 'info',

  resolved_refund: 'success',
}

export function toneFor(status?: string | null): Tone {
  if (!status) return 'neutral'
  return STATUS_TONES[status.toLowerCase().replace(/[\s-]/g, '_')] ?? 'neutral'
}
