/**
 * The tone palette moved to `@/components/dashboard/ToneBadge` once the orders
 * table needed the same status colours. Re-exported here so existing imports in
 * this feature keep working.
 */
export {
  ToneBadge,
  TONE_CLASS,
  TONE_DOT_CLASS,
  type Tone,
} from '@/components/dashboard/ToneBadge'
