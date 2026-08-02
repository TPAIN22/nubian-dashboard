import type { LucideIcon } from 'lucide-react'

/* ============================================================================
   Console navigation model
   ----------------------------------------------------------------------------
   One declarative source drives the sidebar, the breadcrumb trail and the
   command palette — for BOTH consoles. Adding a route to a console's nav config
   lights it up in all three surfaces of that console.

   This file deliberately contains no admin- or merchant-specific data. Each
   console owns a `ConsoleNav` (see components/admin/shell/nav.ts and
   components/merchant/shell/nav.ts) and hands it to <ConsoleShell>.
   ========================================================================== */

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** Key into the console's live counts record — renders a badge when non-zero. */
  badge?: string
  /** Extra path prefixes that should keep this item highlighted. */
  match?: string[]
  /** Extra command-palette search terms (English aliases, synonyms). */
  keywords?: string[]
  /** Sub-routes surfaced in the palette and breadcrumbs, not in the sidebar. */
  children?: { label: string; href: string }[]
  /**
   * Free-form gate evaluated against the viewer. Consoles decide what the flag
   * means — `/admin` uses it for platform-financial surfaces that `support`
   * must not see.
   */
  requires?: string
}

export type NavGroup = {
  id: string
  /** Omitted for the top-level group so "Overview" needs no heading. */
  label?: string
  items: NavItem[]
}

export type ConsoleNav = {
  /** Route prefix that owns this console — '/admin' or '/merchant'. */
  root: string
  /** First crumb in every trail. */
  rootLabel: string
  /** Chip beside the wordmark, e.g. "الإدارة" / "المتجر". */
  badgeLabel: string
  /** Where the wordmark links, and the target of the root crumb. */
  homeHref: string
  groups: NavGroup[]
  /** The one primary action pinned above the nav groups. */
  primaryAction?: { href: string; label: string }
  /** Console-specific command-palette entries, listed above navigation. */
  commands?: { label: string; href: string; icon: LucideIcon; shortcut?: string }[]
  /** Where the topbar bell points. Omit to hide it. */
  notificationsHref?: string
  /**
   * Labels for path segments that are not nav items — wizard steps, sub-tabs
   * and verbs. Dynamic ids are handled by the breadcrumb context instead.
   */
  segmentLabels?: Record<string, string>
}

/* -------------------------------------------------------------------------- */
/* Derived lookups                                                            */
/* -------------------------------------------------------------------------- */

export function allNavItems(nav: ConsoleNav): NavItem[] {
  return nav.groups.flatMap((g) => g.items)
}

/** Maps a path to its owning nav item, longest prefix wins. */
export function findNavItem(nav: ConsoleNav, pathname: string): NavItem | undefined {
  let best: NavItem | undefined
  let bestLen = -1
  for (const item of allNavItems(nav)) {
    for (const p of [item.href, ...(item.match ?? [])]) {
      if ((pathname === p || pathname.startsWith(`${p}/`)) && p.length > bestLen) {
        best = item
        bestLen = p.length
      }
    }
  }
  return best
}

/** True when a nav item should render as active for the current path. */
export function isNavItemActive(nav: ConsoleNav, item: NavItem, pathname: string): boolean {
  // The console root must not swallow every child route.
  if (item.href === nav.root) return pathname === nav.root
  return [item.href, ...(item.match ?? [])].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

/**
 * Drops items the viewer may not see and any group left empty as a result.
 * `grants` is the set of `requires` flags the viewer holds.
 */
export function filterNav(nav: ConsoleNav, grants: readonly string[] = []): ConsoleNav {
  const groups = nav.groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.requires || grants.includes(i.requires)),
    }))
    .filter((g) => g.items.length > 0)
  return { ...nav, groups }
}
