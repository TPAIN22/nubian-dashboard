'use client'

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { AnalyticsCards } from '@/features/notifications/components/AnalyticsCards'
import { EmptyState } from '@/features/notifications/components/EmptyState'
import { NotificationDetailDrawer } from '@/features/notifications/components/NotificationDetailDrawer'
import { NotificationTable } from '@/features/notifications/components/NotificationTable'
import { QueueHealthGrid } from '@/features/notifications/components/QueueHealthGrid'
import { StatCard } from '@/features/notifications/components/StatCard'
import { useMarkRead, useNotifications, useQueueStats } from '@/features/notifications/hooks'
import type { NotificationFilters, NotificationRecord } from '@/features/notifications/types'
import { formatNumber, formatPercentage } from '@/features/notifications/utils'

const RECENT_FILTERS: NotificationFilters = {
  limit: 25,
  offset: 0,
  sort: 'createdAt',
  order: 'desc',
}

export default function NotificationsOverviewPage() {
  const stats = useQueueStats()
  const recent = useNotifications(RECENT_FILTERS)
  const failed = useNotifications({
    ...RECENT_FILTERS,
    status: 'failed',
    limit: 5,
  })
  const markRead = useMarkRead()
  const [active, setActive] = useState<NotificationRecord | null>(null)

  // Memoize so downstream useMemo hooks don't see a fresh array every
  // render when recent.data hasn't actually changed.
  const notifications = useMemo(
    () => recent.data?.notifications ?? [],
    [recent.data?.notifications],
  )

  const totals = useMemo(() => {
    const out = { sent: 0, failed: 0, queued: 0, delivered: 0, total: notifications.length }
    notifications.forEach((n) => {
      if (n.status === 'sent') out.sent++
      else if (n.status === 'delivered') out.delivered++
      else if (n.status === 'failed') out.failed++
      else if (n.status === 'queued' || n.status === 'pending' || n.status === 'retrying')
        out.queued++
    })
    return out
  }, [notifications])

  const deliveredOrSent = totals.sent + totals.delivered
  const successRate =
    totals.total === 0 ? 100 : (deliveredOrSent / Math.max(totals.total, 1)) * 100
  const failureRate = totals.total === 0 ? 0 : (totals.failed / totals.total) * 100

  const totalFailedQueueJobs = useMemo(() => {
    if (!stats.data) return 0
    return Object.values(stats.data).reduce(
      (sum, s) => sum + (s.counts?.failed ?? 0),
      0,
    )
  }, [stats.data])

  return (
    <div className="space-y-6">
      <section
        aria-label="Key metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Sent (recent)"
          value={formatNumber(deliveredOrSent)}
          icon={<CheckCircle2 className="size-4" />}
          accent="success"
          hint="Last 25 notifications"
          loading={recent.isLoading}
        />
        <StatCard
          label="Success rate"
          value={formatPercentage(successRate)}
          icon={<Activity className="size-4" />}
          hint={`${formatNumber(totals.total)} processed`}
          loading={recent.isLoading}
        />
        <StatCard
          label="Queued / retrying"
          value={formatNumber(totals.queued)}
          icon={<Clock className="size-4" />}
          accent="warning"
          hint="In-flight on the queue"
          loading={recent.isLoading}
        />
        <StatCard
          label="Failed jobs"
          value={formatNumber(totalFailedQueueJobs)}
          icon={<AlertTriangle className="size-4" />}
          accent={totalFailedQueueJobs > 0 ? 'danger' : 'default'}
          hint={
            totalFailedQueueJobs > 0 ? (
              <Link className="underline" href="/admin/notifications/queues">
                Investigate in queues →
              </Link>
            ) : (
              'All queues healthy'
            )
          }
          loading={stats.isLoading}
        />
      </section>

      <QueueHealthGrid
        data={stats.data}
        isLoading={stats.isLoading}
        isFetching={stats.isFetching}
        onRefresh={() => stats.refetch()}
        compact
      />

      <AnalyticsCards
        notifications={notifications}
        isLoading={recent.isLoading}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 bg-muted/30 space-y-0">
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <p className="text-xs text-muted-foreground">
                Latest notifications across all channels
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/notifications/history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <NotificationTable
              notifications={notifications.slice(0, 10)}
              isLoading={recent.isLoading}
              isFetching={recent.isFetching}
              onRowClick={setActive}
              filters={RECENT_FILTERS}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAction
                href="/admin/notifications/compose"
                icon={<Send className="size-4" />}
                title="Send a broadcast"
                description="Reach all users or merchants instantly."
              />
              <QuickAction
                href="/admin/notifications/compose"
                icon={<Sparkles className="size-4" />}
                title="Launch a campaign"
                description="Marketing notification with targeted segments."
              />
              <QuickAction
                href="/admin/notifications/queues"
                icon={<Activity className="size-4" />}
                title="Open queue console"
                description="Inspect failed jobs and retry."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent failures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {failed.isLoading ? (
                <p className="py-3 text-xs text-muted-foreground">Loading…</p>
              ) : (failed.data?.notifications ?? []).length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="size-5 text-emerald-500" />}
                  title="No recent failures"
                  description="Last batch delivered cleanly."
                />
              ) : (
                <ul className="space-y-2">
                  {(failed.data?.notifications ?? []).slice(0, 5).map((n) => (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => setActive(n)}
                        className="w-full rounded-lg border border-border/60 bg-card/40 p-3 text-left transition-colors hover:bg-muted/40"
                      >
                        <p className="line-clamp-1 text-sm font-medium">{n.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-destructive">
                          {n.lastError ?? 'Delivery failed'}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {n.type} · attempt {n.attempts ?? 0}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-border/60 bg-card/40 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <span className="flex size-8 flex-none items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="space-y-0.5">
        <p className="text-sm font-medium group-hover:text-primary">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}
