'use client'

import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================================
   Forms
   ----------------------------------------------------------------------------
   The Shopify model: a form is a sequence of labelled SECTIONS, not a stack of
   cards. Fields are 32px, labels sit above at 12px, help text is one line, and
   validation is inline and only shown after the field has been touched.

     <FormSection title="…" description="…">
       <FieldGrid>
         <Field label="…" hint="…" error={…}><Input …/></Field>
       </FieldGrid>
     </FormSection>
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Section + grid                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A titled band of the form. On wide screens the title column sits alongside the
 * fields (Stripe settings style) so long forms stay scannable while scrolling.
 */
export function FormSection({
  title,
  description,
  aside,
  className,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** Contextual help rendered under the description. */
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'grid gap-x-10 gap-y-4 border-b border-border py-6 first:pt-0 last:border-b-0 lg:grid-cols-[minmax(180px,240px)_1fr]',
        className,
      )}
    >
      <div className="lg:sticky lg:top-4 lg:self-start">
        <h3 className="text-[13px] font-semibold leading-5 text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-[12px] leading-[18px] text-text-muted">{description}</p>
        )}
        {aside && <div className="mt-3">{aside}</div>}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  )
}

/** Two-up field grid that collapses on narrow viewports. */
export function FieldGrid({
  columns = 2,
  className,
  children,
}: {
  columns?: 1 | 2 | 3
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

const FieldCtx = React.createContext<{ id: string; invalid: boolean } | null>(null)

export function useFieldContext() {
  return React.useContext(FieldCtx)
}

export function Field({
  label,
  hint,
  error,
  required,
  /** End-aligned control on the label row, e.g. a "توليد تلقائي" link. */
  labelAction,
  span,
  className,
  children,
}: {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: string | false | null
  required?: boolean
  labelAction?: React.ReactNode
  /** Makes the field span the full grid width. */
  span?: boolean
  className?: string
  children: React.ReactNode
}) {
  const id = React.useId()
  const invalid = Boolean(error)

  return (
    <FieldCtx.Provider value={{ id, invalid }}>
      <div className={cn('min-w-0', span && 'sm:col-span-full', className)}>
        {label && (
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor={id}
              className="text-[12px] font-medium leading-4 text-foreground"
            >
              {label}
              {required && <span className="ms-0.5 text-tone-danger-fg">*</span>}
            </label>
            {labelAction}
          </div>
        )}

        {children}

        {invalid ? (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-1.5 flex items-start gap-1 text-[11px] leading-4 text-tone-danger-fg"
          >
            <AlertCircle className="mt-px size-3 shrink-0" />
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="mt-1.5 text-[11px] leading-4 text-text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldCtx.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

const controlBase = cn(
  'w-full rounded-[5px] border bg-background text-[13px] text-foreground',
  'placeholder:text-text-faint',
  'transition-[border-color,box-shadow] duration-100',
  'hover:border-border-strong',
  'focus:border-border-focus focus:outline-none focus:ring-0',
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-text-muted',
  'aria-[invalid=true]:border-tone-danger-border aria-[invalid=true]:bg-tone-danger-bg',
)

export function Input({
  className,
  /** Rendered inside the control at the inline-start, e.g. a currency symbol. */
  prefix,
  suffix,
  ...props
}: React.ComponentProps<'input'> & { prefix?: React.ReactNode; suffix?: React.ReactNode }) {
  const ctx = useFieldContext()

  const input = (
    <input
      id={ctx?.id}
      aria-invalid={ctx?.invalid || undefined}
      aria-describedby={ctx ? (ctx.invalid ? `${ctx.id}-error` : `${ctx.id}-hint`) : undefined}
      className={cn(
        controlBase,
        'h-8 px-2.5',
        prefix && 'ps-8',
        suffix && 'pe-8',
        'border-border',
        className,
      )}
      {...props}
    />
  )

  if (!prefix && !suffix) return input

  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="pointer-events-none absolute start-2.5 text-[12px] text-text-faint">
          {prefix}
        </span>
      )}
      {input}
      {suffix && (
        <span className="pointer-events-none absolute end-2.5 text-[12px] text-text-faint">
          {suffix}
        </span>
      )}
    </div>
  )
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  const ctx = useFieldContext()
  return (
    <textarea
      id={ctx?.id}
      aria-invalid={ctx?.invalid || undefined}
      rows={4}
      className={cn(controlBase, 'min-h-20 resize-y border-border px-2.5 py-2 leading-5', className)}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  const ctx = useFieldContext()
  return (
    <div className="relative">
      <select
        id={ctx?.id}
        aria-invalid={ctx?.invalid || undefined}
        className={cn(
          controlBase,
          'h-8 appearance-none border-border ps-2.5 pe-7',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute end-2.5 top-1/2 size-3 -translate-y-1/2 text-text-faint"
      >
        <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Choice rows — radio / checkbox as full-width selectable cards               */
/* -------------------------------------------------------------------------- */

export function ChoiceRow({
  selected,
  title,
  description,
  icon,
  onSelect,
  disabled,
  className,
}: {
  selected: boolean
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  onSelect: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-3 text-start transition-colors focus-ring',
        selected
          ? 'border-border-focus bg-canvas'
          : 'border-border hover:border-border-strong hover:bg-canvas',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {icon && <span className="mt-px shrink-0 text-text-muted">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-foreground">{title}</span>
        {description && (
          <span className="mt-0.5 block text-[12px] leading-[18px] text-text-muted">
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors',
          selected ? 'border-foreground bg-foreground' : 'border-border-strong',
        )}
      >
        {selected && <span className="size-1.5 rounded-full bg-background" />}
      </span>
    </button>
  )
}

/** Label + control on one row, for settings lists. */
export function SettingRow({
  title,
  description,
  control,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  control: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-6 border-b border-border py-3 last:border-b-0',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-[12px] leading-[18px] text-text-muted">{description}</p>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  )
}
