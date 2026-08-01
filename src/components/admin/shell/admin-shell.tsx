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
   Fixed viewport, two panes, zero page-level scroll. The rail and topbar never
   move; only the page body scrolls. That is what lets PageHeader stick and the
   StickyBar pin without the jitter you get when the document itself scrolls.
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
            <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
      </BreadcrumbProvider>
    </CommandPaletteProvider>
  )
}
