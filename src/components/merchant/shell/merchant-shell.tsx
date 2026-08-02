'use client'

import { ConsoleShell } from '@/components/console/shell'
import { useMerchantCounts, useMerchantStatus } from '@/features/merchant/api'
import { MERCHANT_CONSOLE } from './nav'

/**
 * The merchant console: the shared shell plus the merchant nav and counts.
 *
 * The rail chip carries the store name rather than a generic "المتجر" label —
 * a merchant with more than one Nubian account needs to see, at a glance, which
 * shop they are currently operating.
 */
export function MerchantShell({ children }: { children: React.ReactNode }) {
  const { data: status } = useMerchantStatus()
  const counts = useMerchantCounts()

  const store = status?.application
  const storeName = store?.storeName || store?.businessName

  return (
    <ConsoleShell nav={MERCHANT_CONSOLE} counts={counts} brandBadge={storeName}>
      {children}
    </ConsoleShell>
  )
}
