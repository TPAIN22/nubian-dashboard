'use client'

import * as React from 'react'
import { useAuth } from '@clerk/nextjs'

import { axiosInstance } from '@/lib/axiosInstance'
import { EntitySelect, type EntityOption } from '@/components/admin'
import { Input } from '@/components/ui/input'
import {
  BANNER_TARGET_TYPES,
  BANNER_TARGET_TYPES_UNSUPPORTED,
  BANNER_TARGET_TYPE_LABELS,
  NONE_TARGET,
  type BannerTarget,
  type BannerTargetType,
} from '@/lib/bannerTarget'

/* ============================================================================
   Banner target
   ----------------------------------------------------------------------------
   Type first, then exactly one destination control. Switching type replaces the
   whole target object rather than merging into it, so a stale store id can
   never survive a switch to "url" — the same reason the schema is a
   discriminated union.
   ========================================================================== */

const SEARCH_LIMIT = 20

/** Case-insensitive substring match, for the lists small enough to filter here. */
const matches = (haystack: string, query: string) =>
  haystack.toLowerCase().includes(query.trim().toLowerCase())

export function BannerTargetField({
  value,
  onChange,
  error,
  disabled,
}: {
  value: BannerTarget
  onChange: (target: BannerTarget) => void
  error?: string
  disabled?: boolean
}) {
  const { getToken } = useAuth()

  const authHeaders = React.useCallback(async () => {
    const token = await getToken()
    return { Authorization: `Bearer ${token}` }
  }, [getToken])

  /* -- Stores: `/merchants` is admin-only and returns the full list, so the
        query is applied here rather than round-tripping. ------------------- */
  const searchStores = React.useCallback(
    async (query: string): Promise<EntityOption[]> => {
      const res = await axiosInstance.get('/merchants', { headers: await authHeaders() })
      const list = res.data?.data ?? res.data ?? []
      return (Array.isArray(list) ? list : [])
        .filter((m: any) => m.status === 'approved')
        .filter((m: any) => !query.trim() || matches(String(m.storeName ?? ''), query))
        .slice(0, SEARCH_LIMIT)
        .map((m: any) => ({ id: m._id, label: m.storeName || m.email || m._id, hint: m.city }))
    },
    [authHeaders],
  )

  const resolveStore = React.useCallback(
    async (id: string): Promise<EntityOption | null> => {
      const res = await axiosInstance.get(`/merchants/${id}`, { headers: await authHeaders() })
      const m = res.data?.data ?? res.data
      return m ? { id: m._id, label: m.storeName || m._id, hint: m.city } : null
    },
    [authHeaders],
  )

  /* -- Categories: a short, cached list; filtered client-side. ------------- */
  const searchCategories = React.useCallback(async (query: string): Promise<EntityOption[]> => {
    const res = await axiosInstance.get('/categories')
    const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
    return list
      .filter((c: any) => !query.trim() || matches(String(c.name ?? ''), query))
      .slice(0, SEARCH_LIMIT)
      .map((c: any) => ({ id: c._id, label: c.name || c._id }))
  }, [])

  const resolveCategory = React.useCallback(async (id: string): Promise<EntityOption | null> => {
    const res = await axiosInstance.get(`/categories/${id}`)
    const c = res.data?.data ?? res.data
    return c ? { id: c._id, label: c.name || c._id } : null
  }, [])

  /* -- Products: the catalogue is unbounded, so this one searches server-side
        via the admin endpoint's `search` parameter. ----------------------- */
  const searchProducts = React.useCallback(
    async (query: string): Promise<EntityOption[]> => {
      const params = new URLSearchParams({ limit: String(SEARCH_LIMIT) })
      if (query.trim()) params.set('search', query.trim())
      const res = await axiosInstance.get(`/products/admin/all?${params}`, {
        headers: await authHeaders(),
      })
      const list = res.data?.data ?? []
      return (Array.isArray(list) ? list : []).map((p: any) => ({
        id: p._id,
        label: p.name || p._id,
        hint: p.merchant?.storeName,
      }))
    },
    [authHeaders],
  )

  /* -- Collections: admin-only listing, small enough to filter server-side
        through the same `search` parameter the products endpoint uses. ----- */
  const searchCollections = React.useCallback(
    async (query: string): Promise<EntityOption[]> => {
      const params = new URLSearchParams({ limit: String(SEARCH_LIMIT), isActive: 'true' })
      if (query.trim()) params.set('search', query.trim())
      const res = await axiosInstance.get(`/collections/admin/all?${params}`, {
        headers: await authHeaders(),
      })
      const list = res.data?.data ?? []
      return (Array.isArray(list) ? list : []).map((c: any) => ({
        id: c._id,
        label: c.name || c._id,
        hint: `${c.productCount ?? 0} منتج`,
      }))
    },
    [authHeaders],
  )

  const resolveCollection = React.useCallback(
    async (id: string): Promise<EntityOption | null> => {
      const res = await axiosInstance.get(`/collections/admin/${id}`, {
        headers: await authHeaders(),
      })
      const c = res.data?.data ?? res.data
      return c ? { id: c._id, label: c.name || c._id, hint: `${c.productCount ?? 0} منتج` } : null
    },
    [authHeaders],
  )

  const resolveProduct = React.useCallback(
    async (id: string): Promise<EntityOption | null> => {
      const res = await axiosInstance.get(`/products/${id}`, { headers: await authHeaders() })
      const p = res.data?.data ?? res.data
      return p ? { id: p._id, label: p.name || p._id, hint: p.merchant?.storeName } : null
    },
    [authHeaders],
  )

  const handleTypeChange = (type: BannerTargetType) => {
    // Build a fresh target for the new type — never carry values across.
    if (type === 'url') onChange({ type: 'url', url: '' })
    else if (type === 'none') onChange(NONE_TARGET)
    else onChange({ type, id: '' } as BannerTarget)
  }

  const entityId = 'id' in value ? value.id : ''
  const pickerProps = {
    value: entityId || null,
    disabled,
    invalid: Boolean(error),
    onChange: (option: EntityOption | null) =>
      onChange({ type: value.type, id: option?.id ?? '' } as BannerTarget),
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <label htmlFor="banner-target-type" className="block mb-2 font-medium">
          الوجهة
        </label>
        <select
          id="banner-target-type"
          value={value.type}
          disabled={disabled}
          onChange={(e) => handleTypeChange(e.target.value as BannerTargetType)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {BANNER_TARGET_TYPES.map((type) => {
            const unsupported = BANNER_TARGET_TYPES_UNSUPPORTED.includes(type)
            return (
              <option key={type} value={type} disabled={unsupported}>
                {BANNER_TARGET_TYPE_LABELS[type]}
                {unsupported ? ' (غير متاح بعد)' : ''}
              </option>
            )
          })}
        </select>
        <div className="text-xs text-muted-foreground mt-1">
          إلى أين ينتقل المستخدم عند الضغط على البانر. اختر &quot;بدون وجهة&quot; لبانر ثابت.
        </div>
      </div>

      {value.type === 'store' && (
        <EntitySelect
          {...pickerProps}
          search={searchStores}
          resolve={resolveStore}
          placeholder="ابحث عن متجر بالاسم..."
          emptyText="لا توجد متاجر مطابقة"
        />
      )}

      {value.type === 'collection' && (
        <EntitySelect
          {...pickerProps}
          search={searchCollections}
          resolve={resolveCollection}
          placeholder="ابحث عن مجموعة بالاسم..."
          emptyText="لا توجد مجموعات مفعّلة مطابقة"
        />
      )}

      {value.type === 'product' && (
        <EntitySelect
          {...pickerProps}
          search={searchProducts}
          resolve={resolveProduct}
          placeholder="ابحث عن منتج بالاسم..."
          emptyText="لا توجد منتجات مطابقة"
        />
      )}

      {value.type === 'category' && (
        <EntitySelect
          {...pickerProps}
          search={searchCategories}
          resolve={resolveCategory}
          placeholder="ابحث عن فئة بالاسم..."
          emptyText="لا توجد فئات مطابقة"
        />
      )}

      {value.type === 'url' && (
        <Input
          type="url"
          inputMode="url"
          dir="ltr"
          value={'url' in value ? value.url : ''}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          onChange={(e) => onChange({ type: 'url', url: e.target.value })}
          placeholder="https://example.com/..."
        />
      )}

      {error && <div className="text-destructive text-sm">{error}</div>}
    </div>
  )
}
