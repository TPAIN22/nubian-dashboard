'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { SignedIn, UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '../page'
import { useBreadcrumbTrail } from './breadcrumbs'
import { useCommandPalette } from './command-palette'

/* ============================================================================
   Topbar — 48px, and it earns every pixel
   ----------------------------------------------------------------------------
   Breadcrumbs on the start edge (they tell you where you are, which a static
   product name never did), utilities on the end. Page title and primary actions
   live in the PageHeader below, not here — duplicating them is what forced the
   old shell to 64px + another 80px of page chrome.
   ========================================================================== */

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const crumbs = useBreadcrumbTrail()

  return (
    <header className="flex h-(--topbar-h) shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="فتح القائمة"
        className="grid size-7 shrink-0 place-items-center rounded-[5px] text-text-muted transition-colors hover:bg-canvas-hover hover:text-foreground focus-ring lg:hidden"
      >
        <Menu className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs items={crumbs} />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <SearchTrigger />
        <NotificationsButton />
        <ThemeToggle />
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'size-6 rounded-[5px]',
                userButtonTrigger: 'rounded-[5px] focus:shadow-none',
              },
            }}
          />
        </SignedIn>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */

function SearchTrigger() {
  const { setOpen } = useCommandPalette()
  const [mac, setMac] = React.useState(false)

  React.useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform ?? ''))
  }, [])

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'group flex h-7 items-center gap-2 rounded-[5px] border border-border px-2',
        'text-[12px] text-text-faint transition-colors hover:border-border-strong hover:text-text-muted focus-ring',
        'sm:w-52',
      )}
    >
      <Search className="size-3.5 shrink-0" />
      <span className="hidden flex-1 text-start sm:block">بحث في لوحة التحكم</span>
      <kbd className="hidden rounded-[3px] border border-border px-1 font-mono text-[10px] leading-4 sm:block">
        {mac ? '⌘' : 'Ctrl'}K
      </kbd>
    </button>
  )
}

function NotificationsButton() {
  return (
    <Link
      href="/admin/notifications"
      aria-label="الإشعارات"
      className="relative grid size-7 place-items-center rounded-[5px] text-text-muted transition-colors hover:bg-canvas-hover hover:text-foreground focus-ring"
    >
      <Bell className="size-4" />
    </Link>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="تبديل السمة"
      className="grid size-7 place-items-center rounded-[5px] text-text-muted transition-colors hover:bg-canvas-hover hover:text-foreground focus-ring"
    >
      {/* Render a stable icon until hydration to avoid a theme flash. */}
      {mounted && resolvedTheme === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </button>
  )
}
