import * as z from 'zod'

/**
 * Collection (dashboard mirror).
 *
 * Mirrors `backend/src/lib/collection.js`, which is the source of truth. This
 * exists so the admin gets a field-level error before submitting rather than a
 * 400 afterwards — the server re-validates everything regardless, including the
 * one rule that cannot live here: whether each product id actually exists.
 */

export const COLLECTION_NAME_MIN = 2
export const COLLECTION_NAME_MAX = 120
export const COLLECTION_DESCRIPTION_MAX = 1000
export const COLLECTION_PRODUCTS_MAX = 200
export const COLLECTION_SORT_ORDER_MAX = 100000

const OBJECT_ID_RE = /^[a-f\d]{24}$/i

/**
 * One row of the ordered picker.
 *
 * The label rides along with the id so the list can render names without a
 * lookup per row, and so an edit form shows what the admin curated rather than
 * a column of ObjectIds. Only `_id` is sent to the API.
 *
 * Everything but `_id` is optional because the admin detail endpoint returns
 * `name: null` for a curated product that no longer resolves — the row keeps
 * its slot so the admin can see it and remove it deliberately.
 */
const productRow = z.object({
  _id: z.string().regex(OBJECT_ID_RE, 'معرّف منتج غير صالح'),
  name: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  storeName: z.string().nullable().optional(),
  /** False when the product is hidden from shoppers — curated but not visible. */
  available: z.boolean().optional(),
  /** True when the id no longer resolves to a product at all. */
  missing: z.boolean().optional(),
})

export type CollectionProductRow = z.infer<typeof productRow>

export const collectionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(COLLECTION_NAME_MIN, 'اسم المجموعة مطلوب')
    .max(COLLECTION_NAME_MAX, `الاسم يجب ألا يتجاوز ${COLLECTION_NAME_MAX} حرفاً`),
  description: z
    .string()
    .trim()
    .max(COLLECTION_DESCRIPTION_MAX, `الوصف يجب ألا يتجاوز ${COLLECTION_DESCRIPTION_MAX} حرفاً`),
  // Optional, like the category image: empty string means "no image".
  image: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'رابط الصورة غير صالح'),
  products: z
    .array(productRow)
    .max(COLLECTION_PRODUCTS_MAX, `الحد الأقصى ${COLLECTION_PRODUCTS_MAX} منتج`)
    // The server rejects duplicates rather than collapsing them, because
    // collapsing would renumber the sequence the admin just arranged. Catch it
    // here so they see which row is the problem before submitting.
    .refine(
      (rows) => new Set(rows.map((r) => r._id)).size === rows.length,
      'لا يمكن تكرار نفس المنتج داخل المجموعة',
    )
    .refine((rows) => rows.every((r) => !r.missing), 'أزل المنتجات المحذوفة قبل الحفظ'),
  isActive: z.boolean(),
  sortOrder: z.coerce
    .number()
    .int('الترتيب يجب أن يكون رقماً صحيحاً')
    .min(0, 'الترتيب يجب أن يكون رقماً موجباً')
    .max(COLLECTION_SORT_ORDER_MAX, 'الترتيب كبير جداً'),
})

export type CollectionFormValues = z.infer<typeof collectionFormSchema>

/** What the list page and the form's API reads share. */
export interface CollectionSummary {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string | null
  isActive: boolean
  sortOrder: number
  productCount: number
  createdAt?: string
  updatedAt?: string
}

export const emptyCollection: CollectionFormValues = {
  name: '',
  description: '',
  image: '',
  products: [],
  isActive: true,
  sortOrder: 0,
}

/** Body for POST/PUT — the API takes bare ids, in order. */
export const toCollectionPayload = (values: CollectionFormValues) => ({
  name: values.name,
  description: values.description,
  image: values.image,
  products: values.products.map((p) => p._id),
  isActive: values.isActive,
  sortOrder: values.sortOrder,
})

/* -------------------------------------------------------------------------- */
/* Ordering helpers — pure, so the reorder buttons stay trivial to reason about */
/* -------------------------------------------------------------------------- */

/** Move the item at `index` one slot toward the start. No-op at the top. */
export function moveUp<T>(rows: T[], index: number): T[] {
  if (index <= 0 || index >= rows.length) return rows
  const next = [...rows]
  ;[next[index - 1], next[index]] = [next[index]!, next[index - 1]!]
  return next
}

/** Move the item at `index` one slot toward the end. No-op at the bottom. */
export function moveDown<T>(rows: T[], index: number): T[] {
  if (index < 0 || index >= rows.length - 1) return rows
  const next = [...rows]
  ;[next[index], next[index + 1]] = [next[index + 1]!, next[index]!]
  return next
}
