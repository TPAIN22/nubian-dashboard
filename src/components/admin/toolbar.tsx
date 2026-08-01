'use client'

import * as React from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/* ============================================================================
   Toolbar — the strip above every list
   ----------------------------------------------------------------------------
   Search, saved views, filters, column control and bulk entry points live on a
   single 40px row. The old dashboard spent 160px of vertical space on this.
   ========================================================================== */

export function Toolbar({ className, children }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-10 shrink-0 items-center gap-2 border-b border-border bg-background px-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ToolbarSpacer() {
  return <div className="flex-1" />
}

export function ToolbarDivider() {
  return <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-border" />
}

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

export function SearchInput({
  value,
  onValueChange,
  placeholder = 'بحث…',
  className,
  autoFocusKey = '/',
}: {
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  className?: string
  /** Global key that focuses this input. Set to null to disable. */
  autoFocusKey?: string | null
}) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!autoFocusKey) return
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable
      if (e.key === autoFocusKey && !typing) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [autoFocusKey])

  return (
    <div className={cn('relative flex h-7 min-w-0 items-center', className)}>
      <Search className="pointer-events-none absolute start-2 size-3.5 text-text-faint" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-7 w-full rounded-[5px] border border-border bg-background ps-7 pe-7',
          'text-[12px] text-foreground placeholder:text-text-faint',
          'transition-colors hover:border-border-strong',
          'focus:border-border-focus focus:outline-none',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="مسح البحث"
          className="absolute end-1.5 grid size-4 place-items-center rounded-[3px] text-text-faint transition-colors hover:bg-canvas-hover hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Filter — a select that reads as a chip                                     */
/* -------------------------------------------------------------------------- */

export type FilterOption = { value: string; label: string; count?: number }

export function Filter({
  label,
  value,
  options,
  onValueChange,
  /** Value that means "no filter". Selecting it clears the chip's active state. */
  allValue = 'all',
  className,
}: {
  label: string
  value: string
  options: FilterOption[]
  onValueChange: (v: string) => void
  allValue?: string
  className?: string
}) {
  const active = value !== allValue
  const current = options.find((o) => o.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[5px] border px-2',
          'text-[12px] font-medium transition-colors focus-ring',
          active
            ? 'border-border-strong bg-canvas text-foreground'
            : 'border-border text-text-muted hover:bg-canvas-hover hover:text-foreground',
          className,
        )}
      >
        <span className={cn(active && 'text-text-muted')}>{label}</span>
        {active && <span className="text-foreground">{current?.label ?? value}</span>}
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => onValueChange(o.value)}
            className="flex items-center justify-between gap-3 text-[12px]"
          >
            <span className="flex items-center gap-2">
              <Check
                className={cn('size-3.5', o.value === value ? 'opacity-100' : 'opacity-0')}
              />
              {o.label}
            </span>
            {o.count != null && (
              <span className="text-[11px] text-text-faint nums">{o.count}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Clears every active filter at once. Only render it when something is active. */
export function ClearFilters({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[5px] px-1.5 text-[12px] text-text-muted transition-colors hover:text-foreground focus-ring"
    >
      <X className="size-3" />
      مسح الفلاتر
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Views — the tab strip under a page header                                  */
/* -------------------------------------------------------------------------- */

export type ViewTab = { id: string; label: string; count?: number }

export function ViewTabs({
  tabs,
  value,
  onValueChange,
  className,
}: {
  tabs: ViewTab[]
  value: string
  onValueChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('-mb-px flex items-center gap-4 overflow-x-auto quiet-scroll', className)}>
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onValueChange(t.id)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-9 shrink-0 items-center gap-1.5 border-b-2 text-[13px] transition-colors focus-ring',
              active
                ? 'border-brand font-medium text-foreground'
                : 'border-transparent text-text-muted hover:text-foreground',
            )}
          >
            {t.label}
            {t.count != null && (
              <span
                className={cn(
                  'rounded-[4px] px-1 text-[11px] leading-4 nums',
                  active ? 'bg-canvas-hover text-foreground' : 'bg-canvas text-text-faint',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = [25, 50, 100],
  className,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
  onPageSizeChange?: (n: number) => void
  pageSizes?: number[]
  className?: string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const btn =
    'inline-flex h-7 items-center rounded-[5px] border border-border px-2 text-[12px] font-medium text-foreground transition-colors hover:bg-canvas-hover disabled:pointer-events-none disabled:opacity-40 focus-ring'

  return (
    <div
      className={cn(
        'flex h-10 shrink-0 items-center justify-between gap-4 border-t border-border bg-background px-3',
        className,
      )}
    >
      <p className="text-[12px] text-text-muted nums">
        {from}–{to} من {total}
      </p>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <DropdownMenu>
            <DropdownMenuTrigger className={btn}>
              {pageSize} / صفحة
              <ChevronDown className="ms-1 size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {pageSizes.map((n) => (
                <DropdownMenuItem
                  key={n}
                  onSelect={() => onPageSizeChange(n)}
                  className="text-[12px]"
                >
                  {n} / صفحة
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <button
          type="button"
          className={btn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          السابق
        </button>
        <span className="text-[12px] text-text-muted nums">
          {page} / {pages}
        </span>
        <button
          type="button"
          className={btn}
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          التالي
        </button>
      </div>
    </div>
  )
}
