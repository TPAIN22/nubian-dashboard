'use client'

import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { CATEGORY_LABELS, CHANNEL_LABELS, STATUS_LABELS } from '../constants'
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationFilters,
  NotificationStatus,
} from '../types'

interface Props {
  filters: NotificationFilters
  onChange: (next: NotificationFilters) => void
  onReset?: () => void
  isFetching?: boolean
}

export function NotificationFiltersBar({ filters, onChange, onReset, isFetching }: Props) {
  const [search, setSearch] = useState(filters.search ?? '')

  useEffect(() => {
    setSearch(filters.search ?? '')
  }, [filters.search])

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search ?? '') !== search) {
        onChange({ ...filters, search: search || undefined, offset: 0 })
      }
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const set = <K extends keyof NotificationFilters>(key: K, value: NotificationFilters[K]) =>
    onChange({ ...filters, [key]: value, offset: 0 })

  const hasActiveFilters =
    !!filters.search ||
    (filters.status && filters.status !== 'all') ||
    (filters.category && filters.category !== 'all') ||
    (filters.channel && filters.channel !== 'all') ||
    !!filters.type

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Label htmlFor="notif-search" className="sr-only">
            Search notifications
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="notif-search"
              placeholder="Search by title, body, recipient or type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor="notif-status" className="sr-only">
            Status
          </Label>
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(v) => set('status', v as NotificationStatus | 'all')}
          >
            <SelectTrigger id="notif-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor="notif-category" className="sr-only">
            Category
          </Label>
          <Select
            value={filters.category ?? 'all'}
            onValueChange={(v) => set('category', v as NotificationCategory | 'all')}
          >
            <SelectTrigger id="notif-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor="notif-channel" className="sr-only">
            Channel
          </Label>
          <Select
            value={filters.channel ?? 'all'}
            onValueChange={(v) => set('channel', v as NotificationChannel | 'all')}
          >
            <SelectTrigger id="notif-channel">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              {Object.entries(CHANNEL_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end justify-end gap-2 lg:col-span-1">
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={isFetching}
            >
              Reset
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
