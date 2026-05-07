'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { CATEGORY_LABELS, CHANNEL_LABELS } from '../constants'
import type { NotificationRecord } from '../types'

interface Props {
  notifications: NotificationRecord[]
  isLoading?: boolean
}

const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

export function AnalyticsCards({ notifications, isLoading }: Props) {
  const dailySeries = useMemo(() => {
    const buckets = new Map<string, { date: string; sent: number; failed: number; queued: number }>()
    const now = Date.now()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000)
      const key = d.toISOString().slice(0, 10)
      buckets.set(key, { date: key, sent: 0, failed: 0, queued: 0 })
    }
    notifications.forEach((n) => {
      const ts = n.sentAt ?? n.createdAt
      if (!ts) return
      const key = new Date(ts).toISOString().slice(0, 10)
      const bucket = buckets.get(key)
      if (!bucket) return
      if (n.status === 'sent' || n.status === 'delivered') bucket.sent++
      else if (n.status === 'failed') bucket.failed++
      else if (n.status === 'queued' || n.status === 'pending' || n.status === 'retrying')
        bucket.queued++
    })
    return Array.from(buckets.values()).map((b) => ({
      ...b,
      label: new Date(b.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }))
  }, [notifications])

  const byChannel = useMemo(() => {
    const map = new Map<string, number>()
    notifications.forEach((n) => map.set(n.channel, (map.get(n.channel) ?? 0) + 1))
    return Array.from(map.entries()).map(([k, value]) => ({
      name: CHANNEL_LABELS[k as keyof typeof CHANNEL_LABELS] ?? k,
      value,
    }))
  }, [notifications])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    notifications.forEach((n) => map.set(n.category, (map.get(n.category) ?? 0) + 1))
    return Array.from(map.entries()).map(([k, value]) => ({
      name: CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] ?? k,
      value,
    }))
  }, [notifications])

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Delivery trend (14 days)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Notifications grouped by terminal status. Derived from the latest page; for
            historical analytics, point this widget at a dedicated metrics endpoint.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailySeries} barCategoryGap={6}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--popover)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconSize={10} />
                <Bar dataKey="sent" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="queued" stackId="a" fill="#0ea5e9" />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By channel</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : byChannel.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={byChannel}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={36}
                    outerRadius={64}
                    paddingAngle={2}
                  >
                    {byChannel.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--popover)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : byCategory.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No data yet</p>
            ) : (
              <ul className="space-y-2">
                {byCategory.map((c, idx) => {
                  const total = byCategory.reduce((sum, x) => sum + x.value, 0) || 1
                  const pct = (c.value / total) * 100
                  return (
                    <li key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{c.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {c.value} · {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: PIE_COLORS[idx % PIE_COLORS.length],
                          }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
