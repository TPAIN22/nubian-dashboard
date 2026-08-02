'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import type { Crumb } from '@/components/admin/page'
import { allNavItems, findNavItem, type ConsoleNav } from './nav-model'

/* ============================================================================
   Breadcrumb trail
   ----------------------------------------------------------------------------
   Derived from the URL + the console's nav config, so no page has to
   hand-assemble a trail. Detail pages call `useSetPageLabel(order.orderNumber)`
   to replace the raw id in the last crumb with something a human recognises.
   ========================================================================== */

type Ctx = { label: string | null; setLabel: (v: string | null) => void }
const BreadcrumbCtx = React.createContext<Ctx | null>(null)

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [label, setLabel] = React.useState<string | null>(null)
  const value = React.useMemo(() => ({ label, setLabel }), [label])
  return <BreadcrumbCtx.Provider value={value}>{children}</BreadcrumbCtx.Provider>
}

/**
 * Names the current record in the breadcrumb trail. Safe to call with
 * `undefined` while the record is still loading.
 */
export function useSetPageLabel(label: string | null | undefined) {
  const ctx = React.useContext(BreadcrumbCtx)
  const setLabel = ctx?.setLabel

  React.useEffect(() => {
    if (!setLabel) return
    setLabel(label ?? null)
    return () => setLabel(null)
  }, [label, setLabel])
}

const looksLikeId = (s: string) => /^[0-9a-f]{8,}$/i.test(s) || /^\d+$/.test(s)

export function useBreadcrumbTrail(nav: ConsoleNav): Crumb[] {
  const pathname = usePathname() || nav.root
  const ctx = React.useContext(BreadcrumbCtx)
  const override = ctx?.label ?? null

  return React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const rootSegments = nav.root.split('/').filter(Boolean)
    if (rootSegments.some((s, i) => segments[i] !== s)) return []

    const crumbs: Crumb[] = [{ label: nav.rootLabel, href: nav.homeHref }]

    const owner = findNavItem(nav, pathname)
    if (owner) {
      // The console's landing page is already represented by the root crumb.
      if (owner.href === nav.homeHref) return [{ label: owner.label }]
      crumbs.push({ label: owner.label, href: owner.href })
    } else if (segments.length === rootSegments.length) {
      return [{ label: nav.rootLabel }]
    }

    // Everything after the nav item's own path becomes a trailing crumb.
    const ownerDepth = owner ? owner.href.split('/').filter(Boolean).length : rootSegments.length
    const rest = segments.slice(ownerDepth)
    const childLookup = allNavItems(nav).flatMap((n) => n.children ?? [])

    rest.forEach((seg, i) => {
      const isLast = i === rest.length - 1
      const href = `/${segments.slice(0, ownerDepth + i + 1).join('/')}`

      let label = nav.segmentLabels?.[seg]
      if (!label) {
        const child = childLookup.find((c) => c.href === href)
        label =
          child?.label ??
          (looksLikeId(seg) ? (isLast && override ? override : `#${seg.slice(-6)}`) : seg)
      }

      crumbs.push(isLast ? { label } : { label, href })
    })

    // Collapse a redundant duplicate when the owner href equals the full path.
    return crumbs.filter((c, i, arr) => i === 0 || c.label !== arr[i - 1]?.label)
  }, [pathname, override, nav])
}
