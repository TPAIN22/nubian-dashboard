'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { ConsoleShell } from '@/components/console/shell'
import { adminConsoleFor } from './nav'
import { useAdminCounts } from './use-admin-counts'

/**
 * The admin console: the shared shell plus the admin nav and counts.
 *
 * `support` gets the same chrome with the platform-financial routes filtered
 * out — see `adminConsoleFor`.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const role = user?.publicMetadata?.role as string | undefined
  const nav = React.useMemo(() => adminConsoleFor(role), [role])
  const counts = useAdminCounts()

  return (
    <ConsoleShell nav={nav} counts={counts}>
      {children}
    </ConsoleShell>
  )
}
