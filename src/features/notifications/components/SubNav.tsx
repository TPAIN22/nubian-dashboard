'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * Section tabs for the notification centre.
 *
 * Rendered inside the admin `PageHeader`'s `tabs` slot, so it must be a flush
 * underline strip rather than a self-positioning sticky bar — the page header
 * already handles stickiness. Labels are Arabic to match the rest of /admin.
 */
type NavItem = {
  href: string
  label: string
  exact?: boolean
}

const ITEMS: readonly NavItem[] = [
  { href: '/admin/notifications', label: 'نظرة عامة', exact: true },
  { href: '/admin/notifications/history', label: 'السجل' },
  { href: '/admin/notifications/compose', label: 'إنشاء إشعار' },
  { href: '/admin/notifications/queues', label: 'الطوابير' },
  { href: '/admin/notifications/preferences', label: 'التفضيلات' },
]

export function NotificationsSubNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="أقسام الإشعارات" className="-mb-px">
      <ul className="flex items-center gap-4 overflow-x-auto quiet-scroll">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-9 shrink-0 items-center whitespace-nowrap border-b-2 text-[13px] transition-colors focus-ring',
                  active
                    ? 'border-brand font-medium text-foreground'
                    : 'border-transparent text-text-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
