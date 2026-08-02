'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, PanelLeft, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { isNavItemActive, type ConsoleNav, type NavGroup } from './nav-model'

/* ============================================================================
   Sidebar
   ----------------------------------------------------------------------------
   Three things this fixes versus a flat link list:
     1. GROUPING. Fifteen flat links with no hierarchy read as a settings page.
     2. ACTIVE STATE. Not a solid gold row — a 2px brand rule on the inline-start
        edge plus a quiet raised surface. The Linear/Vercel treatment.
     3. COLLAPSE. Rail mode (52px) keeps icons + tooltips; groups themselves
        collapse and remember their state, per console.

   RTL-native: the rail sits on the right, the active rule hugs the start edge.
   ========================================================================== */

/** Namespaces localStorage so the two consoles remember their own layout. */
const consoleKey = (nav: ConsoleNav) => nav.root.replace(/\W+/g, '') || 'console'

export function useSidebarCollapsed(key: string) {
  const storageKey = `nubian.${key}.sidebar.collapsed`
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(storageKey) === '1')
    } catch {
      /* private mode */
    }
  }, [storageKey])

  const toggle = React.useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      try {
        window.localStorage.setItem(storageKey, next ? '1' : '0')
      } catch {
        /* private mode */
      }
      return next
    })
  }, [storageKey])

  return { collapsed, toggle }
}

/* -------------------------------------------------------------------------- */

export function Sidebar({
  nav,
  counts,
  brandBadge,
  collapsed,
  onToggle,
  /** Mobile drawer: renders inline without the fixed rail chrome. */
  inSheet = false,
  onNavigate,
}: {
  nav: ConsoleNav
  counts: Partial<Record<string, number>>
  /** Overrides `nav.badgeLabel` — the merchant rail shows the store name. */
  brandBadge?: string
  collapsed: boolean
  onToggle: () => void
  inSheet?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname() || ''
  const isRail = collapsed && !inSheet
  const groupsKey = `nubian.${consoleKey(nav)}.sidebar.groups`

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(groupsKey)
      if (raw) setOpenGroups(JSON.parse(raw))
    } catch {
      /* corrupt entry — everything stays open */
    }
  }, [groupsKey])

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: prev[id] === false }
      try {
        window.localStorage.setItem(groupsKey, JSON.stringify(next))
      } catch {
        /* private mode */
      }
      return next
    })
  }

  return (
    <TooltipProvider delayDuration={300} disableHoverableContent>
      <div
        data-collapsed={isRail || undefined}
        className={cn(
          'flex h-full flex-col border-e border-sidebar-border bg-sidebar',
          'transition-[width] duration-200 ease-out',
          inSheet ? 'w-full' : isRail ? 'w-(--sidebar-w-icon)' : 'w-(--sidebar-w)',
        )}
      >
        {/* ---- Brand ------------------------------------------------------ */}
        <div
          className={cn(
            'flex h-(--topbar-h) shrink-0 items-center border-b border-sidebar-border',
            isRail ? 'justify-center px-0' : 'gap-2 px-3',
          )}
        >
          <Link
            href={nav.homeHref}
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2 rounded-[5px] focus-ring"
          >
            <BrandMark />
            {!isRail && (
              <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold tracking-[-0.01em] text-foreground">
                <span className="shrink-0">Nubian</span>
                <span className="truncate rounded-[4px] bg-canvas-hover px-1 py-px text-[10px] font-medium text-text-muted">
                  {brandBadge || nav.badgeLabel}
                </span>
              </span>
            )}
          </Link>

          {!inSheet && !isRail && (
            <button
              type="button"
              onClick={onToggle}
              aria-label="طي القائمة"
              className="ms-auto grid size-6 shrink-0 place-items-center rounded-[5px] text-text-faint transition-colors hover:bg-sidebar-accent hover:text-foreground focus-ring"
            >
              <PanelLeft className="size-3.5" />
            </button>
          )}
        </div>

        {/* ---- Primary action --------------------------------------------- */}
        {nav.primaryAction && (
          <div className={cn('shrink-0 py-2.5', isRail ? 'px-2' : 'px-2.5')}>
            <NavAction
              href={nav.primaryAction.href}
              label={nav.primaryAction.label}
              rail={isRail}
              onNavigate={onNavigate}
            />
          </div>
        )}

        {/* ---- Groups ----------------------------------------------------- */}
        <nav
          className={cn(
            'min-h-0 flex-1 overflow-y-auto quiet-scroll pb-3',
            isRail ? 'px-2' : 'px-2.5',
            !nav.primaryAction && 'pt-2.5',
          )}
          aria-label="التنقل الرئيسي"
        >
          {nav.groups.map((group) => (
            <NavGroupBlock
              key={group.id}
              nav={nav}
              group={group}
              pathname={pathname}
              counts={counts}
              rail={isRail}
              open={openGroups[group.id] !== false}
              onToggle={() => toggleGroup(group.id)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {/* ---- Rail expand ------------------------------------------------ */}
        {isRail && (
          <div className="shrink-0 border-t border-sidebar-border p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggle}
                  aria-label="توسيع القائمة"
                  className="grid h-8 w-full place-items-center rounded-[5px] text-text-faint transition-colors hover:bg-sidebar-accent hover:text-foreground focus-ring"
                >
                  <PanelLeft className="size-4 rotate-180" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">توسيع القائمة</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function BrandMark() {
  return (
    <span
      aria-hidden
      className="grid size-6 shrink-0 place-items-center rounded-[6px] bg-foreground text-background"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
        <path
          d="M8 1.5 14 5v6l-6 3.5L2 11V5l6-3.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M8 5.5v5M5.5 6.8v2.4M10.5 6.8v2.4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

function NavAction({
  href,
  label,
  rail,
  onNavigate,
}: {
  href: string
  label: string
  rail: boolean
  onNavigate?: () => void
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex h-8 items-center gap-2 rounded-[6px] bg-primary text-primary-foreground',
        'text-[12px] font-medium transition-opacity hover:opacity-90 focus-ring',
        rail ? 'justify-center px-0' : 'px-2.5',
      )}
    >
      <Plus className="size-4 shrink-0" />
      {!rail && <span className="truncate">{label}</span>}
    </Link>
  )

  if (!rail) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  )
}

function NavGroupBlock({
  nav,
  group,
  pathname,
  counts,
  rail,
  open,
  onToggle,
  onNavigate,
}: {
  nav: ConsoleNav
  group: NavGroup
  pathname: string
  counts: Partial<Record<string, number>>
  rail: boolean
  open: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const items = (
    <ul className="space-y-px">
      {group.items.map((item) => {
        const active = isNavItemActive(nav, item, pathname)
        const count = item.badge ? counts[item.badge] : undefined
        const Icon = item.icon

        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex h-[30px] items-center rounded-[6px] transition-colors focus-ring',
              rail ? 'justify-center px-0' : 'gap-2.5 px-2',
              active
                ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-brand"
              />
            )}
            <Icon
              className={cn(
                'size-4 shrink-0 transition-colors',
                active ? 'text-foreground' : 'text-text-faint group-hover:text-text-muted',
              )}
            />
            {!rail && (
              <>
                <span className="min-w-0 flex-1 truncate text-[13px] leading-5">{item.label}</span>
                {count ? <CountPill value={count} active={active} /> : null}
              </>
            )}
            {rail && count ? (
              <span
                aria-hidden
                className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-brand"
              />
            ) : null}
          </Link>
        )

        return (
          <li key={item.href}>
            {rail ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="left" className="flex items-center gap-2">
                  {item.label}
                  {count ? <span className="opacity-60 nums">{count}</span> : null}
                </TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        )
      })}
    </ul>
  )

  if (!group.label) return <div className="pb-1">{items}</div>

  if (rail) {
    return (
      <div className="mt-1.5 border-t border-sidebar-border pt-1.5 first:mt-0 first:border-0 first:pt-0">
        {items}
      </div>
    )
  }

  return (
    <div className="pt-3 first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group mb-1 flex h-6 w-full items-center gap-1 rounded-[4px] px-2 text-[11px] font-medium text-text-faint transition-colors hover:text-text-muted focus-ring"
      >
        <span className="truncate">{group.label}</span>
        <ChevronDown
          className={cn(
            'size-3 opacity-0 transition-[transform,opacity] group-hover:opacity-60',
            !open && 'rotate-180 opacity-60',
          )}
        />
      </button>
      {open && items}
    </div>
  )
}

function CountPill({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-[4px] px-1 text-[10px] font-semibold leading-4 nums',
        active ? 'bg-background text-foreground' : 'bg-tone-warning-bg text-tone-warning-fg',
      )}
    >
      {value > 99 ? '99+' : value}
    </span>
  )
}
