'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, Columns3, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/* ============================================================================
   DataTable
   ----------------------------------------------------------------------------
   Config-driven so a list page is a column array plus a data source, not 400
   lines of <td>. Ships with the things operators actually need and admin
   templates always omit: sticky header, row selection with a floating bulk bar,
   column visibility, sortable headers, keyboard-navigable rows, and real
   loading / empty / error states.

   32px rows, 12px text, tabular numerals. Dense on purpose.
   ========================================================================== */

export type SortDir = 'asc' | 'desc'

export type Column<T> = {
  id: string
  header: React.ReactNode
  cell: (row: T, index: number) => React.ReactNode
  /** Any CSS width — '1fr', '180px', 'minmax(120px,1fr)' is not used; this is a <col> width. */
  width?: string
  align?: 'start' | 'end' | 'center'
  /** Enables the sort control in the header. Sorting itself is caller-owned. */
  sortable?: boolean
  /** Excluded from the column-visibility menu when false. */
  hideable?: boolean
  defaultHidden?: boolean
  /** Truncates instead of wrapping. Default true. */
  truncate?: boolean
  className?: string
  headerClassName?: string
}

type SelectionState = {
  selected: string[]
  onChange: (ids: string[]) => void
}

/* ============================================================================
   Column visibility
   ----------------------------------------------------------------------------
   Lifted out of DataTable so the "Columns" control can live on the toolbar —
   where it belongs — while the table stays the thing that renders rows. Call
   the hook in the page, spread `visible` into DataTable, drop `menu` in the
   toolbar. Tables that don't care can omit it and DataTable manages its own.
   ========================================================================== */

export type ColumnVisibility<T> = {
  visible: Column<T>[]
  menu: React.ReactNode
}

export function useColumnVisibility<T>(
  columns: Column<T>[],
  /** Persists the user's choice under `nubian.cols.<key>`. */
  storageKey?: string,
): ColumnVisibility<T> {
  const [hidden, setHidden] = React.useState<string[]>(() =>
    columns.filter((c) => c.defaultHidden).map((c) => c.id),
  )

  React.useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(`nubian.cols.${storageKey}`)
      if (raw) setHidden(JSON.parse(raw))
    } catch {
      /* corrupt entry — fall back to the declared defaults */
    }
  }, [storageKey])

  const toggle = React.useCallback(
    (id: string) => {
      setHidden((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        if (storageKey && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(`nubian.cols.${storageKey}`, JSON.stringify(next))
          } catch {
            /* quota / private mode — visibility just won't persist */
          }
        }
        return next
      })
    },
    [storageKey],
  )

  const visible = React.useMemo(
    () => columns.filter((c) => !hidden.includes(c.id)),
    [columns, hidden],
  )

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[5px] border border-border px-2',
          'text-[12px] font-medium text-text-muted transition-colors',
          'hover:bg-canvas-hover hover:text-foreground focus-ring',
        )}
      >
        <Columns3 className="size-3.5" />
        الأعمدة
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[11px] text-text-faint">
          إظهار الأعمدة
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns
          .filter((c) => c.hideable !== false)
          .map((c) => (
            <DropdownMenuCheckboxItem
              key={c.id}
              checked={!hidden.includes(c.id)}
              onCheckedChange={() => toggle(c.id)}
              onSelect={(e) => e.preventDefault()}
              className="text-[12px]"
            >
              {typeof c.header === 'string' && c.header ? c.header : c.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return { visible, menu }
}

/* -------------------------------------------------------------------------- */

type DataTableProps<T> = {
  data: T[]
  /**
   * Full column set. When `visibleColumns` is supplied (from
   * `useColumnVisibility`) it is used for rendering instead.
   */
  columns: Column<T>[]
  visibleColumns?: Column<T>[]
  getRowId: (row: T) => string
  loading?: boolean
  /** Number of skeleton rows while loading. */
  skeletonRows?: number
  empty?: React.ReactNode
  selection?: SelectionState
  /** Rendered inside the floating bar when rows are selected. */
  bulkActions?: (selected: string[]) => React.ReactNode
  onRowClick?: (row: T) => void
  sort?: { id: string; dir: SortDir } | null
  onSortChange?: (next: { id: string; dir: SortDir } | null) => void
  stickyHeader?: boolean
  className?: string
  /** Row-level tone stripe, e.g. flagging failed orders. */
  rowAccent?: (row: T) => string | undefined
}

export function DataTable<T>({
  data,
  columns,
  visibleColumns,
  getRowId,
  loading,
  skeletonRows = 8,
  empty,
  selection,
  bulkActions,
  onRowClick,
  sort,
  onSortChange,
  stickyHeader = true,
  className,
  rowAccent,
}: DataTableProps<T>) {
  const visible = React.useMemo(
    () => visibleColumns ?? columns.filter((c) => !c.defaultHidden),
    [visibleColumns, columns],
  )

  /* ---- selection -------------------------------------------------------- */
  const ids = React.useMemo(() => data.map(getRowId), [data, getRowId])
  const selectedSet = React.useMemo(
    () => new Set(selection?.selected ?? []),
    [selection?.selected],
  )
  const allSelected = ids.length > 0 && ids.every((id) => selectedSet.has(id))
  const someSelected = !allSelected && ids.some((id) => selectedSet.has(id))

  const toggleAll = () => {
    if (!selection) return
    selection.onChange(allSelected ? [] : ids)
  }

  const toggleRow = (id: string) => {
    if (!selection) return
    selection.onChange(
      selectedSet.has(id)
        ? selection.selected.filter((x) => x !== id)
        : [...selection.selected, id],
    )
  }

  /* ---- sorting ---------------------------------------------------------- */
  const cycleSort = (id: string) => {
    if (!onSortChange) return
    if (sort?.id !== id) return onSortChange({ id, dir: 'asc' })
    if (sort.dir === 'asc') return onSortChange({ id, dir: 'desc' })
    return onSortChange(null)
  }

  const colCount = visible.length + (selection ? 1 : 0)

  return (
    <div className={cn('relative', className)}>
      <div className="overflow-x-auto quiet-scroll">
        <table className="w-full border-collapse text-[12px]">
          <colgroup>
            {selection && <col style={{ width: '36px' }} />}
            {visible.map((c) => (
              <col key={c.id} style={c.width ? { width: c.width } : undefined} />
            ))}
          </colgroup>

          <thead
            className={cn(
              'bg-canvas text-text-muted',
              stickyHeader && 'sticky top-0 z-10',
            )}
          >
            <tr className="border-b border-border">
              {selection && (
                <th scope="col" className="h-8 px-3 align-middle">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    aria-label="تحديد كل الصفوف"
                    className="size-3.5"
                  />
                </th>
              )}
              {visible.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={cn(
                    'h-8 px-3 text-[11px] font-medium whitespace-nowrap',
                    c.align === 'end' && 'text-end',
                    c.align === 'center' && 'text-center',
                    (!c.align || c.align === 'start') && 'text-start',
                    c.headerClassName,
                  )}
                >
                  {c.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => cycleSort(c.id)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-[3px] transition-colors hover:text-foreground focus-ring',
                        sort?.id === c.id && 'text-foreground',
                      )}
                    >
                      {c.header}
                      {sort?.id !== c.id ? (
                        <ChevronsUpDown className="size-3 opacity-40" />
                      ) : sort.dir === 'asc' ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {selection && <td className="h-8 px-3" />}
                  {visible.map((c) => (
                    <td key={c.id} className="h-8 px-3">
                      <div
                        className="h-3 animate-pulse rounded bg-canvas-hover"
                        style={{ width: `${45 + ((i * 13 + c.id.length * 7) % 45)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="p-0">
                  {empty ?? (
                    <div className="py-16 text-center text-[13px] text-text-muted">
                      لا توجد بيانات لعرضها
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const id = getRowId(row)
                const isSelected = selectedSet.has(id)
                const accent = rowAccent?.(row)
                return (
                  <tr
                    key={id}
                    data-selected={isSelected || undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter') onRowClick(row)
                          }
                        : undefined
                    }
                    className={cn(
                      'group border-b border-border transition-colors',
                      'hover:bg-canvas data-[selected]:bg-tone-info-bg',
                      onRowClick && 'cursor-pointer focus-ring',
                    )}
                  >
                    {selection && (
                      <td
                        className="relative h-8 px-3 align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {accent && (
                          <span
                            aria-hidden
                            className={cn('absolute inset-y-0 start-0 w-0.5', accent)}
                          />
                        )}
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="تحديد الصف"
                          className="size-3.5"
                        />
                      </td>
                    )}
                    {visible.map((c, ci) => (
                      <td
                        key={c.id}
                        className={cn(
                          'relative h-8 px-3 align-middle text-foreground',
                          c.truncate !== false && 'max-w-0 truncate',
                          c.align === 'end' && 'text-end nums',
                          c.align === 'center' && 'text-center',
                          c.className,
                        )}
                      >
                        {!selection && ci === 0 && accent && (
                          <span
                            aria-hidden
                            className={cn('absolute inset-y-0 start-0 w-0.5', accent)}
                          />
                        )}
                        {c.cell(row, i)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {selection && selection.selected.length > 0 && (
        <BulkBar
          count={selection.selected.length}
          onClear={() => selection.onChange([])}
          actions={bulkActions?.(selection.selected)}
        />
      )}
    </div>
  )
}

/* ============================================================================
   BulkBar — floats over the table while rows are selected
   ========================================================================== */

export function BulkBar({
  count,
  onClear,
  actions,
}: {
  count: number
  onClear: () => void
  actions?: React.ReactNode
}) {
  return (
    <div className="pointer-events-none sticky bottom-4 z-30 flex justify-center px-4">
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-popover px-2 py-1.5"
        style={{ boxShadow: 'var(--elev-menu)' }}
      >
        <span className="ps-1.5 text-[12px] font-medium text-foreground nums">
          {count} محدد
        </span>
        <span className="h-4 w-px bg-border" aria-hidden />
        {actions}
        <button
          type="button"
          onClick={onClear}
          aria-label="إلغاء التحديد"
          className="grid size-6 place-items-center rounded-[5px] text-text-muted transition-colors hover:bg-canvas-hover hover:text-foreground focus-ring"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ============================================================================
   Cell helpers — keep column definitions to one line
   ========================================================================== */

/** Primary identifier cell: bold title with an optional dim second line. */
export function CellTitle({
  title,
  subtitle,
  media,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  media?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {media}
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{title}</div>
        {subtitle && <div className="truncate text-[11px] text-text-muted">{subtitle}</div>}
      </div>
    </div>
  )
}

/** Dim placeholder for null values — never render an empty cell. */
export function CellEmpty() {
  return <span className="text-text-faint">—</span>
}
