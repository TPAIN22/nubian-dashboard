'use client'

import { useState } from 'react'

import { FailedJobsTable } from '@/features/notifications/components/FailedJobsTable'
import { QueueHealthGrid } from '@/features/notifications/components/QueueHealthGrid'
import { useQueueStats } from '@/features/notifications/hooks'
import type { QueueShortName } from '@/features/notifications/types'

export default function NotificationQueuesPage() {
  const [selected, setSelected] = useState<QueueShortName>('push')
  const stats = useQueueStats()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Queue console</h2>
        <p className="text-sm text-muted-foreground">
          Live BullMQ queue health, failed-job triage, retry, and drain. The current
          queue&apos;s failed set sits below.
        </p>
      </div>

      <QueueHealthGrid
        data={stats.data}
        isLoading={stats.isLoading}
        isFetching={stats.isFetching}
        onRefresh={() => stats.refetch()}
        onSelect={setSelected}
        selected={selected}
      />

      <FailedJobsTable queue={selected} />
    </div>
  )
}
