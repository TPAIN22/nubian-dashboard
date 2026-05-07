'use client'

import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  RotateCw,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { useDrainJobs, useFailedJobs, useRetryJobs } from '../hooks'
import type { QueueShortName } from '../types'
import { formatRelativeTime, truncate } from '../utils'
import { EmptyState } from './EmptyState'

const PAGE_SIZE = 25

export function FailedJobsTable({ queue }: { queue: QueueShortName }) {
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drainOpen, setDrainOpen] = useState(false)
  const [drainDays, setDrainDays] = useState(7)

  const { data, isLoading, isFetching, refetch } = useFailedJobs(queue, {
    limit: PAGE_SIZE,
    offset,
  })
  const retry = useRetryJobs(queue)
  const drain = useDrainJobs(queue)

  const jobs = data?.jobs ?? []
  const total = data?.meta.total ?? 0
  const allSelected = jobs.length > 0 && jobs.every((j) => selected.has(j.id))

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) jobs.forEach((j) => next.delete(j.id))
      else jobs.forEach((j) => next.add(j.id))
      return next
    })
  }

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectedIds = useMemo(() => Array.from(selected), [selected])
  const hasSelection = selectedIds.length > 0

  const handleRetry = (ids?: string[]) => {
    retry.mutate(ids, {
      onSuccess: () => setSelected(new Set()),
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Failed jobs · {queue}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString()} failed · auto-refresh every 10s
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh failed jobs"
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRetry(hasSelection ? selectedIds : undefined)}
            disabled={retry.isPending || (jobs.length === 0 && !hasSelection)}
          >
            {retry.isPending ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <RotateCw className="mr-1 size-4" />
            )}
            {hasSelection ? `Retry ${selectedIds.length}` : 'Retry all'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrainOpen(true)}
            disabled={drain.isPending || total === 0}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1 size-4" />
            Drain old
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {jobs.length === 0 && !isLoading ? (
          <div className="p-8">
            <EmptyState
              icon={<AlertTriangle className="size-5" />}
              title="No failed jobs"
              description={`The ${queue} queue is healthy.`}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all"
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={`fj-sk-${i}`}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full max-w-[180px]" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : jobs.map((job) => (
                      <TableRow key={job.id} className="align-top">
                        <TableCell>
                          <Checkbox
                            aria-label={`Select job ${job.id}`}
                            checked={selected.has(job.id)}
                            onCheckedChange={() => toggleOne(job.id)}
                          />
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="font-mono text-xs font-medium">{job.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            ID: <code>{job.id}</code>
                          </p>
                          {job.dataPreview ? (
                            <pre className="mt-1 max-h-24 overflow-auto rounded bg-muted/60 p-2 text-[10px] leading-relaxed">
                              {JSON.stringify(job.dataPreview, null, 2)}
                            </pre>
                          ) : null}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-xs text-destructive">
                            {truncate(job.failedReason ?? 'Unknown error', 200)}
                          </p>
                          {job.stacktrace?.[0] ? (
                            <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                              {job.stacktrace[0]}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {job.attemptsMade}
                          {job.maxAttempts ? ` / ${job.maxAttempts}` : ''}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatRelativeTime(job.finishedOn ?? job.timestamp)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry([job.id])}
                            disabled={retry.isPending}
                          >
                            <RotateCw className="mr-1 size-3.5" />
                            Retry
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        )}

        {jobs.length > 0 ? (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {offset + 1}–{offset + jobs.length} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + jobs.length >= total}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>

      <AlertDialog open={drainOpen} onOpenChange={setDrainOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drain failed jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently removes failed jobs older than the cutoff. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <label htmlFor="drain-days" className="text-sm font-medium">
              Older than (days)
            </label>
            <Input
              id="drain-days"
              type="number"
              min={0}
              value={drainDays}
              onChange={(e) => setDrainDays(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                drain.mutate(drainDays)
                setDrainOpen(false)
              }}
            >
              Drain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
