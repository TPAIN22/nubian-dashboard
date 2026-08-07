'use client'

import * as React from 'react'
import { Check, Loader2, Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command'

/* ============================================================================
   EntitySelect
   ----------------------------------------------------------------------------
   A single-value picker for "choose one store / product / category".

   Search-first rather than a populated <select>: the existing admin forms fetch
   the whole list up front (coupons pulls `/products?limit=100`, the product
   wizard pulls every merchant) which caps how much of the catalogue is even
   reachable and grows with the business. Here the caller supplies an async
   `search`, so a list can be filtered in memory when it is small (categories)
   or on the server when it is not (products).

   Rendered inline rather than in a popover: the dashboard has no Popover
   primitive, and `multi-select.tsx` already establishes the inline-cmdk pattern.
   ========================================================================== */

export interface EntityOption {
  id: string
  label: string
  /** Secondary line — a store's city, a product's SKU, a category's parent. */
  hint?: string
}

export interface EntitySelectProps {
  /** Currently selected id, or null. */
  value: string | null
  onChange: (option: EntityOption | null) => void
  /**
   * Label for `value` when the picker mounts with a pre-existing selection
   * (edit mode). Pass what you already know; `resolve` fills the gap.
   */
  selectedLabel?: string | null
  /** Fetch matching options. Called debounced, and once with '' on open. */
  search: (query: string) => Promise<EntityOption[]>
  /**
   * Look up a single option by id so an edit form can show a real name instead
   * of a raw ObjectId. Skipped when `selectedLabel` is already known.
   */
  resolve?: (id: string) => Promise<EntityOption | null>
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  invalid?: boolean
  'aria-describedby'?: string
}

const DEBOUNCE_MS = 250
const controlClass =
  'flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs'

export function EntitySelect({
  value,
  onChange,
  selectedLabel,
  search,
  resolve,
  placeholder = 'ابحث...',
  emptyText = 'لا توجد نتائج',
  disabled,
  invalid,
  'aria-describedby': describedBy,
}: EntitySelectProps) {
  const [query, setQuery] = React.useState('')
  const [options, setOptions] = React.useState<EntityOption[]>([])
  const [loading, setLoading] = React.useState(false)
  const [resolvedLabel, setResolvedLabel] = React.useState<string | null>(selectedLabel ?? null)

  // Latest-wins: a slow response for "sho" must not overwrite the results for
  // "shoes" typed after it.
  const requestSeq = React.useRef(0)

  const searchRef = React.useRef(search)
  searchRef.current = search
  const resolveRef = React.useRef(resolve)
  resolveRef.current = resolve

  React.useEffect(() => {
    setResolvedLabel(selectedLabel ?? null)
  }, [selectedLabel])

  /* Resolve the label for a preselected id (edit mode). */
  React.useEffect(() => {
    if (!value || resolvedLabel || !resolveRef.current) return
    let cancelled = false
    resolveRef
      .current(value)
      .then((option) => {
        if (!cancelled && option) setResolvedLabel(option.label)
      })
      .catch(() => {
        /* Fall back to showing the id — better than an empty control. */
      })
    return () => {
      cancelled = true
    }
  }, [value, resolvedLabel])

  /* Debounced search, only while the picker is open (no selection). */
  React.useEffect(() => {
    if (value) return
    const seq = ++requestSeq.current
    setLoading(true)
    const timer = setTimeout(() => {
      searchRef
        .current(query)
        .then((results) => {
          if (seq === requestSeq.current) setOptions(results)
        })
        .catch(() => {
          if (seq === requestSeq.current) setOptions([])
        })
        .finally(() => {
          if (seq === requestSeq.current) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, value])

  const clear = () => {
    setQuery('')
    setOptions([])
    setResolvedLabel(null)
    onChange(null)
  }

  /* ---- Selected state: show the chosen entity, not a search box ---------- */
  if (value) {
    return (
      <div className={cn(controlClass, invalid && 'border-destructive')} aria-describedby={describedBy}>
        <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{resolvedLabel ?? value}</span>
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          aria-label="إزالة الاختيار"
          className="shrink-0 rounded-sm text-muted-foreground transition-opacity hover:opacity-70 disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  /* ---- Empty state: search ---------------------------------------------- */
  return (
    <Command
      // Filtering is the `search` prop's job — cmdk's built-in matcher would
      // re-filter server results against the raw query and hide valid hits.
      shouldFilter={false}
      className="overflow-visible rounded-md border border-input bg-transparent"
    >
      <div className={cn('border-b border-input', invalid && 'border-destructive')}>
        <div className="flex h-9 items-center gap-2 px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {loading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />}
        </div>
      </div>

      <CommandList className="max-h-52">
        {!loading && options.length === 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
        {options.map((option) => (
          <CommandItem
            key={option.id}
            value={option.id}
            onSelect={() => {
              setResolvedLabel(option.label)
              onChange(option)
            }}
            className="flex-col items-start gap-0.5"
          >
            <span className="w-full truncate">{option.label}</span>
            {option.hint && (
              <span className="w-full truncate text-xs text-muted-foreground">{option.hint}</span>
            )}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}
