'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { QUEUE_DESCRIPTIONS, QUEUE_LABELS, QUEUE_SHORT_NAMES } from '../constants'
import type { QueueShortName, QueueStatsMap } from '../types'
import { formatNumber, getQueueBacklog } from '../utils'

interface Props {
  data?: QueueStatsMap
  isLoading?: boolean
  isFetching?: boolean
  onRefresh?: () => void
  onSelect?: (queue: QueueShortName) => void
  selected?: QueueShortName
  compact?: boolean
}

export function QueueHealthGrid({
  data,
  isLoading,
  isFetching,
  onRefresh,
  onSelect,
  selected,
  compact,
}: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border/60 bg-muted/30">
        <div>
          <CardTitle className="text-base">Queue health</CardTitle>
          <p className="text-xs text-muted-foreground">
            BullMQ workers — auto-refreshes every 5s
          </p>
        </div>
        {onRefresh ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Refresh queue health"
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        <div
          className={cn(
            'grid gap-px bg-border/60',
            compact
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
              : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-5',
          )}
        >
          {QUEUE_SHORT_NAMES.map((q) => {
            const stat = data?.[q]
            const counts = stat?.counts
            const backlog = getQueueBacklog(counts)
            const failed = counts?.failed ?? 0
            const error = stat?.error
            const tone =
              error || failed > 0
                ? 'danger'
                : backlog > 100
                  ? 'warning'
                  : 'success'

            const interactive = !!onSelect
            return (
              <button
                key={q}
                type="button"
                disabled={!interactive}
                onClick={() => onSelect?.(q)}
                aria-pressed={selected === q || undefined}
                className={cn(
                  'group flex flex-col gap-3 bg-card p-4 text-left transition-colors',
                  interactive && 'hover:bg-muted/40 focus-visible:bg-muted/40',
                  selected === q && 'bg-primary/5 ring-2 ring-inset ring-primary/30',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{QUEUE_LABELS[q]}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {QUEUE_DESCRIPTIONS[q]}
                    </p>
                  </div>
                  <span aria-label={`Status: ${tone}`}>
                    {tone === 'success' ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : tone === 'warning' ? (
                      <Loader2 className="size-4 text-amber-500" />
                    ) : (
                      <AlertTriangle className="size-4 text-red-500" />
                    )}
                  </span>
                </div>

                {isLoading ? (
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ) : error ? (
                  <p className="text-xs text-destructive">{error}</p>
                ) : (
                  <dl className="grid grid-cols-3 gap-2 text-[11px]">
                    <Stat label="Active" value={counts?.active ?? 0} />
                    <Stat label="Waiting" value={counts?.waiting ?? 0} />
                    <Stat
                      label="Failed"
                      value={failed}
                      emphasize={failed > 0 ? 'danger' : undefined}
                    />
                    <Stat label="Delayed" value={counts?.delayed ?? 0} />
                    <Stat label="Done" value={counts?.completed ?? 0} />
                    <Stat
                      label="Backlog"
                      value={backlog}
                      emphasize={backlog > 100 ? 'warning' : undefined}
                    />
                  </dl>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string
  value: number
  emphasize?: 'danger' | 'warning'
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'font-semibold tabular-nums',
          emphasize === 'danger' && 'text-red-600 dark:text-red-400',
          emphasize === 'warning' && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {formatNumber(value)}
      </dd>
    </div>
  )
}
