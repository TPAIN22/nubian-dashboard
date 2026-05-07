'use client'

import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { CHANNEL_LABELS } from '../constants'
import type { NotificationFilters, NotificationRecord } from '../types'
import { formatRelativeTime, truncate } from '../utils'
import { EmptyState } from './EmptyState'
import {
  NotificationCategoryBadge,
  NotificationStatusBadge,
} from './StatusBadge'

interface Props {
  notifications: NotificationRecord[]
  isLoading?: boolean
  isFetching?: boolean
  onRowClick?: (notification: NotificationRecord) => void
  filters: NotificationFilters
  onSortChange?: (sort: NotificationFilters['sort'], order: NotificationFilters['order']) => void
}

const SKELETON_ROWS = 8

export function NotificationTable({
  notifications,
  isLoading,
  isFetching,
  onRowClick,
  filters,
  onSortChange,
}: Props) {
  const sortIcon = (key: NotificationFilters['sort']) => {
    if (filters.sort !== key) return <ArrowUpDown className="size-3.5 opacity-50" />
    return filters.order === 'asc' ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    )
  }

  const handleSort = (key: NonNullable<NotificationFilters['sort']>) => {
    if (!onSortChange) return
    const nextOrder =
      filters.sort === key && filters.order === 'desc' ? 'asc' : 'desc'
    onSortChange(key, nextOrder)
  }

  if (!isLoading && notifications.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="size-5" />}
        title="No notifications match these filters"
        description="Try removing a filter or expanding the date range."
      />
    )
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div
        className={cn(
          'hidden overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm md:block',
          isFetching && !isLoading && 'opacity-90',
        )}
      >
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[24%]">
                <button
                  type="button"
                  onClick={() => handleSort('createdAt')}
                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Notification {sortIcon('createdAt')}
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort('status')}
                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Status {sortIcon('status')}
                </button>
              </TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead className="text-right">
                <button
                  type="button"
                  onClick={() => handleSort('sentAt')}
                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Sent {sortIcon('sentAt')}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : notifications.map((n) => (
                  <TableRow
                    key={n._id}
                    onClick={onRowClick ? () => onRowClick(n) : undefined}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-muted/40',
                      !n.isRead && 'bg-primary/[0.02]',
                    )}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onRowClick(n)
                            }
                          }
                        : undefined
                    }
                  >
                    <TableCell className="max-w-0">
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">{n.title}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {truncate(n.body, 90)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {n.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <NotificationCategoryBadge category={n.category} />
                    </TableCell>
                    <TableCell>
                      <NotificationStatusBadge status={n.status} />
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      {CHANNEL_LABELS[n.channel] ?? n.channel}
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      {n.recipientType}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatRelativeTime(n.sentAt ?? n.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <li
                key={`m-sk-${i}`}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <Skeleton className="mb-2 h-4 w-2/3" />
                <Skeleton className="mb-2 h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </li>
            ))
          : notifications.map((n) => (
              <li key={n._id}>
                <button
                  type="button"
                  onClick={onRowClick ? () => onRowClick(n) : undefined}
                  className="block w-full rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <NotificationStatusBadge status={n.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{truncate(n.body, 110)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <NotificationCategoryBadge category={n.category} />
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                      {n.type}
                    </span>
                    <span>{CHANNEL_LABELS[n.channel] ?? n.channel}</span>
                    <span aria-hidden>·</span>
                    <span>{formatRelativeTime(n.sentAt ?? n.createdAt)}</span>
                  </div>
                </button>
              </li>
            ))}
      </ul>
    </>
  )
}
