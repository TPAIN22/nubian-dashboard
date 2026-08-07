import * as z from 'zod'

/**
 * Banner → Target (dashboard mirror).
 *
 * Mirrors `backend/src/lib/bannerTarget.js`, which is the source of truth. This
 * exists so the admin gets a field-level error before submitting rather than a
 * 400 afterwards — the server re-validates everything regardless.
 */

export const BANNER_TARGET_TYPES = ['none', 'store', 'collection', 'product', 'category', 'url'] as const

export type BannerTargetType = (typeof BANNER_TARGET_TYPES)[number]

/**
 * Target types the platform cannot resolve yet because the entity does not
 * exist. Shown disabled in the picker; the API rejects them with
 * BANNER_TARGET_TYPE_UNSUPPORTED. Remove an entry here when its model lands.
 *
 * Empty since Collections shipped — `collection` was the last entry. Kept so a
 * future type can be modelled before it is switched on.
 */
export const BANNER_TARGET_TYPES_UNSUPPORTED: BannerTargetType[] = []

export const BANNER_TARGET_URL_MAX = 2048

const OBJECT_ID_RE = /^[a-f\d]{24}$/i

/** Same rules as the backend: absolute http(s), no embedded credentials. */
export function isSafeBannerUrl(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > BANNER_TARGET_URL_MAX) return false
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return false
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  if (parsed.username !== '' || parsed.password !== '') return false
  return parsed.hostname !== ''
}

const objectId = (entity: string) =>
  z
    .string()
    .trim()
    .regex(OBJECT_ID_RE, `اختر ${entity}`)

/**
 * A discriminated union rather than one object with optional fields: it makes
 * the illegal combinations ({ type: 'url', id }) unrepresentable instead of
 * something a cross-field refinement has to catch after the fact, and it is
 * what strips a stale id when the admin switches type.
 */
export const bannerTargetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('store'), id: objectId('متجراً') }),
  z.object({ type: z.literal('collection'), id: objectId('مجموعة') }),
  z.object({ type: z.literal('product'), id: objectId('منتجاً') }),
  z.object({ type: z.literal('category'), id: objectId('فئة') }),
  z.object({
    type: z.literal('url'),
    url: z
      .string()
      .trim()
      .min(1, 'الرابط مطلوب')
      .max(BANNER_TARGET_URL_MAX, 'الرابط طويل جداً')
      .refine(isSafeBannerUrl, 'أدخل رابطاً كاملاً يبدأ بـ https:// أو http://'),
  }),
])

export type BannerTarget = z.infer<typeof bannerTargetSchema>

export const NONE_TARGET: BannerTarget = { type: 'none' }

/** Target types that reference an entity by id. */
export const isEntityTargetType = (type: BannerTargetType): boolean =>
  type !== 'none' && type !== 'url'

/**
 * Read a target off a banner that may predate the feature.
 * A missing or malformed target is `none`, matching every other layer.
 */
export function toFormTarget(raw: unknown): BannerTarget {
  if (!raw || typeof raw !== 'object') return NONE_TARGET
  const value = raw as { type?: unknown; id?: unknown; url?: unknown }
  const type = value.type
  if (typeof type !== 'string' || !(BANNER_TARGET_TYPES as readonly string[]).includes(type)) {
    return NONE_TARGET
  }
  if (type === 'none') return NONE_TARGET
  if (type === 'url') {
    return typeof value.url === 'string' ? { type: 'url', url: value.url } : NONE_TARGET
  }
  return typeof value.id === 'string'
    ? ({ type, id: value.id } as BannerTarget)
    : NONE_TARGET
}

/** Arabic labels for the target-type picker, in the order the admin sees them. */
export const BANNER_TARGET_TYPE_LABELS: Record<BannerTargetType, string> = {
  none: 'بدون وجهة',
  store: 'متجر',
  collection: 'مجموعة',
  product: 'منتج',
  category: 'فئة',
  url: 'رابط',
}
