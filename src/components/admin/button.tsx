import * as React from 'react'
import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================================
   Button
   ----------------------------------------------------------------------------
   Three sizes, all shorter than the shadcn defaults — 36px buttons in a toolbar
   are what made the old header 64px tall. `primary` is ink, not gold: gold is
   the brand, not the call to action (Polaris, Linear and Vercel all do this).
   `brand` exists for the one place per screen that deserves it.
   ========================================================================== */

const buttonVariants = cva(
  cn(
    'relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap',
    'rounded-[5px] font-medium transition-[background-color,border-color,color,opacity] duration-100',
    'disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    'outline-none focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--border-focus)]',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:opacity-90',
        secondary:
          'border border-border-strong bg-background text-foreground hover:bg-canvas-hover',
        ghost: 'text-text-muted hover:bg-canvas-hover hover:text-foreground',
        danger: 'bg-destructive text-destructive-foreground hover:opacity-90',
        'danger-subtle':
          'border border-tone-danger-border bg-tone-danger-bg text-tone-danger-fg hover:opacity-85',
        brand: 'bg-brand text-white hover:opacity-90 dark:text-[#18181b]',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-6 px-1.5 text-[11px] [&_svg]:size-3',
        sm: 'h-7 px-2.5 text-[12px] [&_svg]:size-3.5',
        md: 'h-8 px-3 text-[13px] [&_svg]:size-4',
        lg: 'h-9 px-4 text-[13px] [&_svg]:size-4',
        'icon-xs': 'size-6 [&_svg]:size-3.5',
        'icon-sm': 'size-7 [&_svg]:size-3.5',
        icon: 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'sm' },
  },
)

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    /** Keyboard hint rendered at the inline-end, e.g. "⌘S". */
    kbd?: string
  }

export function Button({
  className,
  variant,
  size,
  asChild,
  loading,
  kbd,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="admin-button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {/*
        `Slottable` marks which child Slot should merge into. Without it, the
        spinner and kbd hint are siblings of `children`, and `asChild` throws
        "Slot failed to slot onto its children" — Slot requires exactly one
        element child. Outside a Slot, Slottable is a transparent passthrough.
      */}
      {loading && <Loader2 className="animate-spin" />}
      <Slottable>{children}</Slottable>
      {kbd && (
        <kbd className="ms-1 rounded-[3px] border border-current/20 px-1 font-mono text-[10px] leading-4 opacity-60">
          {kbd}
        </kbd>
      )}
    </Comp>
  )
}

/** Segmented control — mutually exclusive view switches (grid/list, chart range). */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: {
  value: T
  onValueChange: (v: T) => void
  options: { value: T; label: React.ReactNode; title?: string }[]
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-7 items-center gap-0.5 rounded-[6px] border border-border bg-canvas p-0.5',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            title={o.title}
            aria-selected={active}
            onClick={() => onValueChange(o.value)}
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded-[4px] px-2 text-[12px] font-medium transition-colors focus-ring',
              active
                ? 'bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-text-muted hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export { buttonVariants }
