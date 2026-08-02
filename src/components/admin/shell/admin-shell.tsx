'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { BreadcrumbProvider } from './breadcrumbs'
import { CommandPaletteProvider } from './command-palette'
import { Sidebar, useSidebarCollapsed } from './sidebar'
import { Topbar } from './topbar'

/* ============================================================================
   AdminShell
   ----------------------------------------------------------------------------
   Fixed viewport, two panes. The rail and topbar never move; the document
   itself never scrolls. That is what lets PageHeader stick and the StickyBar
   pin without the jitter you get when the document scrolls.

   Pages built on the <Page> primitives put their scroll inside PageBody, so
   <main> never overflows for them. Pages that predate those primitives are
   plain divs with no scroll container of their own — <main> is overflow-y-auto
   so their content stays reachable instead of being clipped at the fold.
   ========================================================================== */

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const role = user?.publicMetadata?.role as string | undefined
  const { collapsed, toggle } = useSidebarCollapsed()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  // Route change closes the mobile drawer — otherwise it covers the destination.
  React.useEffect(() => setMobileOpen(false), [pathname])

  return (
    <CommandPaletteProvider role={role}>
      <BreadcrumbProvider>
        <div className="flex h-dvh w-full overflow-hidden bg-background">
          {/* Desktop rail */}
          <div className="hidden shrink-0 lg:block">
            <Sidebar role={role} collapsed={collapsed} onToggle={toggle} />
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
                role={role}
                collapsed={false}
                onToggle={toggle}
                inSheet
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
            <main className="min-h-0 flex-1 overflow-y-auto quiet-scroll">{children}</main>
          </div>
        </div>
      </BreadcrumbProvider>
    </CommandPaletteProvider>
  )
}
