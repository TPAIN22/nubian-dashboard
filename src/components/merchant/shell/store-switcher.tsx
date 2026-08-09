'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Store } from 'lucide-react'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, useMyMemberships, useSelectStore } from '@/features/merchant/api'

/**
 * Store switcher.
 *
 * Renders nothing at all for the common case — one store, no choice to make.
 * It appears only once someone actually belongs to more than one shop, which is
 * also the only case where the backend needs to be told which store a request
 * is for (it answers 409 STORE_SELECTION_REQUIRED rather than guessing).
 *
 * The selection is stored server-side as a cookie, not in React state: it has
 * to be readable by the proxy that attaches `x-merchant-id` to every backend
 * call, and it has to survive a refresh. Switching drops the merchant query
 * cache — every cached list belongs to the store that was active when it was
 * fetched.
 */
export function StoreSwitcher({ activeStoreId }: { activeStoreId?: string }) {
  const router = useRouter()
  const memberships = useMyMemberships()
  const select = useSelectStore()

  const stores = React.useMemo(
    () => (memberships.data ?? []).filter((m) => m.status === 'active'),
    [memberships.data],
  )

  // One store (or none loaded yet) is not a choice — showing a switcher with a
  // single entry is noise on every page of the console.
  if (stores.length < 2) return null

  // Matched on id, not name: two stores may legitimately share a name, and the
  // id is what the backend actually resolved the request against.
  const active = stores.find((s) => s.merchantId === activeStoreId) ?? stores[0]

  const onSelect = (merchantId: string, storeName: string) => {
    if (merchantId === active?.merchantId) return
    select.mutate(merchantId, {
      onSuccess: () => {
        toast.success(`تم التبديل إلى ${storeName}`)
        // The server components above this tree resolved against the previous
        // cookie, so a refresh is what actually re-renders them.
        router.refresh()
      },
      onError: (err: Error) => toast.error(err.message || 'تعذر تبديل المتجر'),
    })
  }

  return (
    // Owns its chrome so the sidebar can render the slot bare — see the note in
    // sidebar.tsx about the empty band a wrapper would leave behind.
    <div className="shrink-0 border-b border-sidebar-border px-2.5 py-2">
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={select.isPending}
        className={cn(
          'flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-start',
          'text-[12px] text-foreground transition-colors',
          'hover:bg-sidebar-accent focus-ring disabled:opacity-60',
        )}
      >
        <Store className="size-3.5 shrink-0 text-text-faint" />
        <span className="min-w-0 flex-1 truncate font-medium">
          {active?.storeName ?? 'اختر متجراً'}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-text-faint" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-[11px] font-normal text-text-muted">
          متاجرك
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.merchantId}
            onSelect={() => onSelect(store.merchantId, store.storeName)}
            className="gap-2"
          >
            <Check
              className={cn(
                'size-3.5 shrink-0',
                store.merchantId === active?.merchantId ? 'opacity-100' : 'opacity-0',
              )}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px]">{store.storeName}</span>
              <span className="block text-[10px] text-text-faint">
                {ROLE_LABELS[store.role]}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  )
}
