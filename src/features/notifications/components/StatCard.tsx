import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  trend?: { value: number; direction: 'up' | 'down'; label?: string }
  loading?: boolean
  className?: string
  accent?: 'default' | 'success' | 'warning' | 'danger'
}

const ACCENT: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'from-muted/40 to-transparent',
  success: 'from-emerald-500/10 to-transparent',
  warning: 'from-amber-500/10 to-transparent',
  danger: 'from-red-500/10 to-transparent',
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  loading,
  className,
  accent = 'default',
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-border/60 bg-gradient-to-b shadow-sm',
        ACCENT[accent],
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon ? <span className="text-muted-foreground/80">{icon}</span> : null}
        </div>

        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {hint ? <span>{hint}</span> : <span />}
          {trend ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                trend.direction === 'up'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : 'bg-red-500/10 text-red-600 dark:text-red-300',
              )}
            >
              {trend.direction === 'up' ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(trend.value).toFixed(1)}%
              {trend.label ? <span className="ml-1 opacity-70">{trend.label}</span> : null}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
