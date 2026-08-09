'use client'

import { ConsoleShell } from '@/components/console/shell'
import { useMerchantCounts, useMerchantProfile } from '@/features/merchant/api'
import { MERCHANT_CONSOLE } from './nav'
import { StoreSwitcher } from './store-switcher'

/**
 * The merchant console: the shared shell plus the merchant nav and counts.
 *
 * The rail chip carries the store name rather than a generic "المتجر" label —
 * a merchant needs to see, at a glance, which shop they are operating.
 *
 * That name comes from `my-profile`, not `my-status`. `my-status` reports on the
 * caller's own merchant *application*, which is empty for anybody who joined a
 * store by invitation rather than by applying — it would have left every staff
 * member looking at an unlabelled rail. `my-profile` returns the store the
 * backend actually resolved the request against.
 *
 * Since a store can be run by a team, one person may also belong to several
 * shops. The switcher under the brand renders only in that case; with a single
 * store it returns null and the rail looks exactly as it did before.
 */
export function MerchantShell({ children }: { children: React.ReactNode }) {
  const { data: profile } = useMerchantProfile()
  const counts = useMerchantCounts()

  return (
    <ConsoleShell
      nav={MERCHANT_CONSOLE}
      counts={counts}
      brandBadge={profile?.storeName}
      brandSlot={<StoreSwitcher activeStoreId={profile?._id} />}
    >
      {children}
    </ConsoleShell>
  )
}
