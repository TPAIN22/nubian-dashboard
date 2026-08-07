'use client'

import * as React from 'react'
import Image from 'next/image'
import { useAuth } from '@clerk/nextjs'
import { ArrowDown, ArrowUp, ImageIcon, Trash2 } from 'lucide-react'

import { axiosInstance } from '@/lib/axiosInstance'
import { Button, EntitySelect, StatusBadge, type EntityOption } from '@/components/admin'
import {
  COLLECTION_PRODUCTS_MAX,
  moveDown,
  moveUp,
  type CollectionProductRow,
} from '@/lib/collection'

/* ============================================================================
   Collection products
   ----------------------------------------------------------------------------
   Search-to-add, then an explicit ordered list.

   The search box is `EntitySelect` — the same picker the banner target uses —
   held permanently in its unselected state by passing `value={null}`. That is
   the whole adaptation: it already does debounced, latest-wins, server-side
   search, so a second picker system would only be a second thing to keep in
   sync. Selection is intercepted and appended to the list instead of becoming
   the control's value.

   Order is data, not presentation: the sequence here is the sequence shoppers
   see, so it is edited explicitly with ↑/↓ rather than inferred from a sort.
   ========================================================================== */

const SEARCH_LIMIT = 20
const THUMB = 36

export function CollectionProductsField({
  value,
  onChange,
  error,
  disabled,
}: {
  value: CollectionProductRow[]
  onChange: (rows: CollectionProductRow[]) => void
  error?: string
  disabled?: boolean
}) {
  const { getToken } = useAuth()
  const [searchKey, setSearchKey] = React.useState(0)

  // Selected ids are excluded from results, so the admin cannot add a duplicate
  // the server would reject. Held in a ref so `search` stays referentially
  // stable — EntitySelect re-runs its effect on every `search` identity change.
  const selectedIds = React.useRef<Set<string>>(new Set())
  selectedIds.current = new Set(value.map((r) => r._id))

  const searchProducts = React.useCallback(
    async (query: string): Promise<EntityOption[]> => {
      const token = await getToken()
      const params = new URLSearchParams({ limit: String(SEARCH_LIMIT) })
      if (query.trim()) params.set('search', query.trim())

      const res = await axiosInstance.get(`/products/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const list = res.data?.data ?? []
      return (Array.isArray(list) ? list : [])
        .filter((p: { _id: string }) => !selectedIds.current.has(p._id))
        .map((p: { _id: string; name?: string; images?: string[]; merchant?: { storeName?: string } }) => ({
          id: p._id,
          label: p.name || p._id,
          hint: p.merchant?.storeName,
          // Carried through onChange via the lookup below.
          ...({ image: p.images?.[0] } as Record<string, unknown>),
        }))
    },
    [getToken],
  )

  const add = (option: EntityOption | null) => {
    if (!option) return
    if (selectedIds.current.has(option.id)) return
    if (value.length >= COLLECTION_PRODUCTS_MAX) return

    onChange([
      ...value,
      {
        _id: option.id,
        name: option.label,
        image: (option as unknown as { image?: string }).image ?? null,
        storeName: option.hint ?? null,
        available: true,
        missing: false,
      },
    ])
    // Remount the picker so it clears its query and result list — it owns that
    // state internally and has no imperative reset.
    setSearchKey((k) => k + 1)
  }

  const atCap = value.length >= COLLECTION_PRODUCTS_MAX

  return (
    <div className="space-y-3">
      {!atCap && (
        <EntitySelect
          key={searchKey}
          value={null}
          onChange={add}
          search={searchProducts}
          disabled={disabled}
          invalid={Boolean(error)}
          placeholder="ابحث عن منتج بالاسم لإضافته..."
          emptyText="لا توجد منتجات مطابقة"
        />
      )}

      {atCap && (
        <p className="text-[12px] text-text-muted">
          بلغت المجموعة الحد الأقصى ({COLLECTION_PRODUCTS_MAX} منتج). احذف منتجاً لإضافة آخر.
        </p>
      )}

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-[13px] font-medium text-foreground">لا توجد منتجات بعد</p>
          <p className="mt-1 text-[12px] text-text-muted">
            ابحث أعلاه وأضف المنتجات. الترتيب هنا هو نفس ترتيب ظهورها للعملاء.
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-border rounded-lg border border-border">
          {value.map((row, index) => (
            <li key={row._id} className="flex items-center gap-3 p-2.5">
              <span className="w-6 shrink-0 text-center text-[12px] tabular-nums text-text-muted">
                {index + 1}
              </span>

              {row.image ? (
                <Image
                  src={row.image}
                  alt=""
                  width={THUMB}
                  height={THUMB}
                  unoptimized
                  className="shrink-0 rounded-[4px] border border-border object-cover"
                />
              ) : (
                <div
                  style={{ width: THUMB, height: THUMB }}
                  className="grid shrink-0 place-items-center rounded-[4px] border border-border bg-canvas text-text-faint"
                >
                  <ImageIcon className="size-3.5" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-foreground">
                  {row.name ?? <span dir="ltr">{row._id}</span>}
                </p>
                {row.storeName && (
                  <p className="truncate text-[11px] text-text-muted">{row.storeName}</p>
                )}
              </div>

              {/* A curated product can outlive its listing. Say so rather than
                  letting the admin wonder why shoppers don't see it. */}
              {row.missing ? (
                <StatusBadge tone="danger" label="محذوف" />
              ) : row.available === false ? (
                <StatusBadge tone="warning" label="مخفي" />
              ) : null}

              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  type="button"
                  disabled={disabled || index === 0}
                  aria-label={`نقل ${row.name ?? 'المنتج'} لأعلى`}
                  onClick={() => onChange(moveUp(value, index))}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  type="button"
                  disabled={disabled || index === value.length - 1}
                  aria-label={`نقل ${row.name ?? 'المنتج'} لأسفل`}
                  onClick={() => onChange(moveDown(value, index))}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  type="button"
                  disabled={disabled}
                  className="text-text-faint hover:text-tone-danger-fg"
                  aria-label={`إزالة ${row.name ?? 'المنتج'}`}
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {error && <p className="text-[11px] text-tone-danger-fg">{error}</p>}
    </div>
  )
}
