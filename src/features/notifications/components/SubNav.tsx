'use client'

import { cn } from '@/lib/utils'
import { Activity, BellRing, Inbox, Send, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  icon: typeof Activity
  exact?: boolean
}

const ITEMS: readonly NavItem[] = [
  { href: '/admin/notifications', label: 'Overview', icon: Activity, exact: true },
  { href: '/admin/notifications/history', label: 'History', icon: Inbox },
  { href: '/admin/notifications/compose', label: 'Compose', icon: Send },
  { href: '/admin/notifications/queues', label: 'Queues', icon: BellRing },
  { href: '/admin/notifications/preferences', label: 'Preferences', icon: SlidersHorizontal },
]

export function NotificationsSubNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Notification sections"
      className="sticky top-0 z-10 -mx-4 mb-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8"
    >
      <ul className="flex items-center gap-1 overflow-x-auto py-2">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
