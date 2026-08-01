'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, CheckCircle2, Send, Sparkles } from 'lucide-react'

import {
  Button,
  EmptyState as AdminEmptyState,
  Section,
  Stack,
  Stat,
  StatRow,
} from '@/components/admin'

import { AnalyticsCards } from '@/features/notifications/components/AnalyticsCards'
import { NotificationDetailDrawer } from '@/features/notifications/components/NotificationDetailDrawer'
import { NotificationTable } from '@/features/notifications/components/NotificationTable'
import { QueueHealthGrid } from '@/features/notifications/components/QueueHealthGrid'
import { useMarkRead, useNotifications, useQueueStats } from '@/features/notifications/hooks'
import type { NotificationFilters, NotificationRecord } from '@/features/notifications/types'
import { formatNumber, formatPercentage } from '@/features/notifications/utils'

/* ============================================================================
   Notification centre — overview
   ----------------------------------------------------------------------------
   Data hooks are unchanged (useQueueStats / useNotifications / useMarkRead).
   The page header and section tabs now live in the section layout, and the four
   bespoke StatCards have been replaced by the shared StatRow so this screen
   matches every other overview in the admin. Copy translated to Arabic.
   ========================================================================== */

const RECENT_FILTERS: NotificationFilters = {
  limit: 25,
  offset: 0,
  sort: 'createdAt',
  order: 'desc',
}

export default function NotificationsOverviewPage() {
  const stats = useQueueStats()
  const recent = useNotifications(RECENT_FILTERS)
  const failed = useNotifications({ ...RECENT_FILTERS, status: 'failed', limit: 5 })
  const markRead = useMarkRead()
  const [active, setActive] = useState<NotificationRecord | null>(null)

  // Memoized so downstream useMemo hooks don't see a fresh array every render.
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

  const totalFailedQueueJobs = useMemo(() => {
    if (!stats.data) return 0
    return Object.values(stats.data).reduce((sum, s) => sum + (s.counts?.failed ?? 0), 0)
  }, [stats.data])

  const failures = failed.data?.notifications ?? []

  return (
    <Stack gap="lg">
      <StatRow columns={4}>
        <Stat
          label="تم الإرسال"
          value={formatNumber(deliveredOrSent)}
          hint="آخر 25 إشعاراً"
          loading={recent.isLoading}
        />
        <Stat
          label="نسبة النجاح"
          value={formatPercentage(successRate)}
          hint={`${formatNumber(totals.total)} تمت معالجتها`}
          loading={recent.isLoading}
        />
        <Stat
          label="في الطابور / إعادة محاولة"
          value={formatNumber(totals.queued)}
          hint="قيد الإرسال حالياً"
          loading={recent.isLoading}
        />
        <Stat
          label="مهام فاشلة"
          value={formatNumber(totalFailedQueueJobs)}
          emphasis={totalFailedQueueJobs > 0}
          loading={stats.isLoading}
          href={totalFailedQueueJobs > 0 ? '/admin/notifications/queues' : undefined}
          hint={
            totalFailedQueueJobs > 0 ? 'افحصها في وحدة الطوابير ←' : 'كل الطوابير سليمة'
          }
        />
      </StatRow>

      <QueueHealthGrid
        data={stats.data}
        isLoading={stats.isLoading}
        isFetching={stats.isFetching}
        onRefresh={() => stats.refetch()}
        compact
      />

      <AnalyticsCards notifications={notifications} isLoading={recent.isLoading} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Section
          title="النشاط الأخير"
          description="أحدث الإشعارات عبر كل القنوات"
          variant="panel"
          flush
          actions={
            <Button variant="secondary" size="xs" asChild>
              <Link href="/admin/notifications/history">عرض الكل</Link>
            </Button>
          }
        >
          <div className="p-3">
            <NotificationTable
              notifications={notifications.slice(0, 10)}
              isLoading={recent.isLoading}
              isFetching={recent.isFetching}
              onRowClick={setActive}
              filters={RECENT_FILTERS}
            />
          </div>
        </Section>

        <Stack gap="md">
          <Section title="إجراءات سريعة" variant="panel" contentClassName="space-y-1.5">
            <QuickAction
              href="/admin/notifications/compose"
              icon={<Send className="size-3.5" />}
              title="إرسال بث جماعي"
              description="الوصول إلى كل المستخدمين أو التجار فوراً."
            />
            <QuickAction
              href="/admin/notifications/compose"
              icon={<Sparkles className="size-3.5" />}
              title="إطلاق حملة"
              description="إشعار تسويقي موجَّه لشرائح محددة."
            />
            <QuickAction
              href="/admin/notifications/queues"
              icon={<Activity className="size-3.5" />}
              title="فتح وحدة الطوابير"
              description="فحص المهام الفاشلة وإعادة تشغيلها."
            />
          </Section>

          <Section title="أحدث الإخفاقات" variant="panel" flush>
            {failed.isLoading ? (
              <p className="px-4 py-6 text-center text-[12px] text-text-muted">
                جارٍ التحميل…
              </p>
            ) : failures.length === 0 ? (
              <AdminEmptyState
                icon={<CheckCircle2 className="size-4 text-tone-success-fg" />}
                title="لا إخفاقات حديثة"
                description="تم تسليم آخر دفعة بالكامل."
              />
            ) : (
              <ul className="divide-y divide-border">
                {failures.slice(0, 5).map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => setActive(n)}
                      className="w-full px-4 py-2.5 text-start transition-colors hover:bg-canvas focus-ring"
                    >
                      <p className="line-clamp-1 text-[12px] font-medium text-foreground">
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-tone-danger-fg">
                        {n.lastError ?? 'فشل التسليم'}
                      </p>
                      <p className="mt-1 text-[11px] text-text-faint">
                        {n.type} · محاولة {n.attempts ?? 0}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </Stack>
      </div>

      <NotificationDetailDrawer
        notification={active}
        open={!!active}
        onOpenChange={(open) => !open && setActive(null)}
        onMarkRead={(id) => markRead.mutate(id)}
        isMarking={markRead.isPending}
      />
    </Stack>
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
      className="group flex items-start gap-2.5 rounded-[6px] border border-border p-2.5 transition-colors hover:border-border-strong hover:bg-canvas focus-ring"
    >
      <span className="grid size-6 flex-none place-items-center rounded-[5px] border border-border bg-canvas text-text-muted">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-text-muted">
          {description}
        </span>
      </span>
    </Link>
  )
}
