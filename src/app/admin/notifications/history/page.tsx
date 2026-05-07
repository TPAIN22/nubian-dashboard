'use client'

import { Download, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { NotificationDetailDrawer } from '@/features/notifications/components/NotificationDetailDrawer'
import { NotificationFiltersBar } from '@/features/notifications/components/NotificationFiltersBar'
import { NotificationTable } from '@/features/notifications/components/NotificationTable'
import { useMarkRead, useNotifications } from '@/features/notifications/hooks'
import type {
  NotificationFilters,
  NotificationRecord,
} from '@/features/notifications/types'
import { downloadCsv } from '@/features/notifications/utils'
import { cn } from '@/lib/utils'

const DEFAULT_FILTERS: NotificationFilters = {
  limit: 50,
  offset: 0,
  status: 'all',
  category: 'all',
  channel: 'all',
  recipientType: 'all',
  sort: 'createdAt',
  order: 'desc',
}

export default function NotificationHistoryPage() {
  const [filters, setFilters] = useState<NotificationFilters>(DEFAULT_FILTERS)
  const [active, setActive] = useState<NotificationRecord | null>(null)

  const { data, isLoading, isFetching, refetch } = useNotifications(filters)
  const markRead = useMarkRead()

  const notifications = data?.notifications ?? []
  const total = data?.meta.total ?? notifications.length
  const lastPage = filters.offset + notifications.length >= total

  const visibleRange = useMemo(() => {
    if (notifications.length === 0) return ''
    return `${filters.offset + 1}–${filters.offset + notifications.length}`
  }, [filters.offset, notifications.length])

  const handleExport = () => {
    if (!notifications.length) return
    downloadCsv(
      `notifications-${Date.now()}.csv`,
      notifications.map((n) => ({
        id: n._id,
        title: n.title,
        type: n.type,
        category: n.category,
        status: n.status,
        channel: n.channel,
        recipientType: n.recipientType,
        recipientId: n.recipientId ?? '',
        sentAt: n.sentAt ?? '',
        createdAt: n.createdAt,
        attempts: n.attempts ?? 0,
        lastError: n.lastError ?? '',
      })),
    )
  }

  return (
    <div className="space-y-4">
      <NotificationFiltersBar
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        isFetching={isFetching}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {visibleRange ? (
            <>
              Showing <span className="font-medium text-foreground">{visibleRange}</span>{' '}
              of {total.toLocaleString()}
            </>
          ) : (
            'No results'
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('mr-1 size-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={notifications.length === 0}
          >
            <Download className="mr-1 size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60 p-2">
        <CardContent className="p-0">
          <NotificationTable
            notifications={notifications}
            isLoading={isLoading}
            isFetching={isFetching}
            onRowClick={setActive}
            filters={filters}
            onSortChange={(sort, order) => setFilters((f) => ({ ...f, sort, order }))}
          />
        </CardContent>
      </Card>

      {notifications.length > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.offset === 0}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                offset: Math.max(0, f.offset - f.limit),
              }))
            }
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {Math.floor(filters.offset / filters.limit) + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={lastPage}
            onClick={() =>
              setFilters((f) => ({ ...f, offset: f.offset + f.limit }))
            }
          >
            Next
          </Button>
        </div>
      ) : null}

      <NotificationDetailDrawer
        notification={active}
        open={!!active}
        onOpenChange={(open) => !open && setActive(null)}
        onMarkRead={(id) => markRead.mutate(id)}
        isMarking={markRead.isPending}
      />
    </div>
  )
}
