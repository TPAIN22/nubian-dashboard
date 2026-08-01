import * as React from 'react'
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

/* ============================================================================
   Empty / loading / error states
   ----------------------------------------------------------------------------
   Every list and panel gets all three. A blank screen with "لا توجد بيانات" is
   a dead end; an empty state should say what the thing is and offer the action
   that creates the first one.
   ========================================================================== */

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  /** `inline` for inside a panel/table, `page` for a whole route. */
  size = 'inline',
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  size?: 'inline' | 'page'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        size === 'inline' ? 'py-14' : 'py-24',
        className,
      )}
    >
      <div className="grid size-9 place-items-center rounded-lg border border-border bg-canvas text-text-faint">
        {icon ?? <Inbox className="size-4" />}
      </div>
      <p className="mt-3 text-[13px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[12px] leading-5 text-text-muted">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

export function ErrorState({
  title = 'تعذر تحميل البيانات',
  description,
  onRetry,
  size = 'inline',
  className,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  onRetry?: () => void
  size?: 'inline' | 'page'
  className?: string
}) {
  return (
    <EmptyState
      size={size}
      className={className}
      icon={<AlertTriangle className="size-4 text-tone-danger-fg" />}
      title={title}
      description={description ?? 'حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.'}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw />
            إعادة المحاولة
          </Button>
        )
      }
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Skeletons                                                                  */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-[5px] bg-canvas-hover', className)}
      {...props}
    />
  )
}

/** Matches the StatRow footprint exactly so the page doesn't jump on load. */
export function StatRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div
      className="grid gap-px overflow-hidden rounded-lg border border-border bg-border"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="bg-card px-4 py-3.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2.5 h-6 w-24" />
          <Skeleton className="mt-2 h-2.5 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <Skeleton className="size-7 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="mt-1.5 h-2.5 w-1/5" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Spinner                                                                    */
/* -------------------------------------------------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="جارٍ التحميل"
      className={cn(
        'inline-block size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent opacity-60',
        className,
      )}
    />
  )
}
