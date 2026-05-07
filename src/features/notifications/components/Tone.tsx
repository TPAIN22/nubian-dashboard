import { cn } from '@/lib/utils'

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted'

const TONE_BG: Record<Tone, string> = {
  success:
    'bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/30',
  warning:
    'bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:text-amber-300 dark:ring-amber-400/30',
  danger:
    'bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-500/20 dark:text-red-300 dark:ring-red-400/30',
  info: 'bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/20 dark:text-sky-300 dark:ring-sky-400/30',
  muted:
    'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
}

const TONE_DOT: Record<Tone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
  muted: 'bg-muted-foreground/60',
}

export function ToneBadge({
  tone = 'muted',
  withDot = true,
  className,
  children,
}: {
  tone?: Tone
  withDot?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        TONE_BG[tone],
        className,
      )}
    >
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[tone])} />}
      {children}
    </span>
  )
}

export const TONE_CLASS = TONE_BG
export const TONE_DOT_CLASS = TONE_DOT
