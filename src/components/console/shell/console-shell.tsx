'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { BreadcrumbProvider } from './breadcrumbs'
import { CommandPaletteProvider } from './command-palette'
import { Sidebar, useSidebarCollapsed } from './sidebar'
import { Topbar } from './topbar'
import type { ConsoleNav } from './nav-model'

/* ============================================================================
   ConsoleShell
   ----------------------------------------------------------------------------
   Fixed viewport, two panes. The rail and topbar never move; the document
   itself never scrolls. That is what lets PageHeader stick and StickyBar pin
   without the jitter you get when the document scrolls.

   Pages built on the <Page> primitives put their scroll inside PageBody, so
   <main> never overflows for them. Pages that predate those primitives are
   plain divs with no scroll container of their own — <main> is overflow-y-auto
   so their content stays reachable instead of being clipped at the fold.

   Both /admin and /merchant mount this. The only thing that differs between
   them is the `nav` config and the counts feeding the sidebar badges.
   ========================================================================== */

export function ConsoleShell({
  nav,
  counts = {},
  brandBadge,
  children,
}: {
  nav: ConsoleNav
  counts?: Partial<Record<string, number>>
  brandBadge?: string
  children: React.ReactNode
}) {
  const { collapsed, toggle } = useSidebarCollapsed(nav.root.replace(/\W+/g, '') || 'console')
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  // Route change closes the mobile drawer — otherwise it covers the destination.
  React.useEffect(() => setMobileOpen(false), [pathname])

  return (
    <CommandPaletteProvider nav={nav}>
      <BreadcrumbProvider>
        <div className="flex h-dvh w-full overflow-hidden bg-background">
          {/* Desktop rail */}
          <div className="hidden shrink-0 lg:block">
            <Sidebar
              nav={nav}
              counts={counts}
              brandBadge={brandBadge}
              collapsed={collapsed}
              onToggle={toggle}
            />
          </div>

          {/* Mobile drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              side="right"
              className="w-(--sidebar-w) p-0 [&>button]:hidden"
              aria-describedby={undefined}
            >
              <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
              <Sidebar
                nav={nav}
                counts={counts}
                brandBadge={brandBadge}
                collapsed={false}
                onToggle={toggle}
                inSheet
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar nav={nav} onOpenMobileNav={() => setMobileOpen(true)} />
            <main className="min-h-0 flex-1 overflow-y-auto quiet-scroll">{children}</main>
          </div>
        </div>
      </BreadcrumbProvider>
    </CommandPaletteProvider>
  )
}
