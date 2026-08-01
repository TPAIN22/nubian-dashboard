'use client'

import * as React from 'react'
import Image from 'next/image'
import { AlertCircle, Check, ImageOff, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Meta } from '@/components/admin'

/* ============================================================================
   Product wizard chrome
   ----------------------------------------------------------------------------
   The old wizard put a horizontal 700px-min stepper inside a card above the
   form: it scrolled sideways on anything narrow, the circles were 40px, and the
   only way to know where you were was a colour.

   This is the Shopify/Stripe shape instead:
     · a vertical rail on the inline-start edge — always visible, always shows
       the whole journey, states are legible at a glance (done / current /
       error / skipped);
     · a live summary on the inline-end edge that updates as you type, so the
       Review step stops being the first time you see what you're building;
     · nothing in the middle competing for attention.
   ========================================================================== */

export type WizardStepState = 'done' | 'current' | 'upcoming' | 'error' | 'skipped'

export type WizardStep = {
  num: number
  title: string
  /** One line of context shown under the title on the active step. */
  hint?: string
  state: WizardStepState
}

/* -------------------------------------------------------------------------- */
/* Step rail                                                                  */
/* -------------------------------------------------------------------------- */

export function WizardNav({
  steps,
  onSelect,
  className,
}: {
  steps: WizardStep[]
  onSelect: (num: number) => void
  className?: string
}) {
  return (
    <nav aria-label="خطوات إنشاء المنتج" className={cn('relative', className)}>
      <ol className="relative space-y-0.5">
        {steps.map((step, i) => {
          const disabled = step.state === 'skipped'
          const last = i === steps.length - 1

          return (
            <li key={step.num} className="relative">
              {/* Connector runs behind the marker, stopping at the last step. */}
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute start-[11px] top-7 h-[calc(100%-14px)] w-px',
                    step.state === 'done' ? 'bg-foreground/25' : 'bg-border',
                  )}
                />
              )}

              <button
                type="button"
                onClick={() => !disabled && onSelect(step.num)}
                disabled={disabled}
                aria-current={step.state === 'current' ? 'step' : undefined}
                className={cn(
                  'group relative flex w-full items-start gap-2.5 rounded-[6px] px-2 py-1.5 text-start transition-colors focus-ring',
                  disabled
                    ? 'cursor-not-allowed opacity-45'
                    : step.state === 'current'
                      ? 'bg-canvas'
                      : 'hover:bg-canvas',
                )}
              >
                <StepMarker state={step.state} num={step.num} />

                <span className="min-w-0 flex-1 pt-0.5">
                  <span
                    className={cn(
                      'block truncate text-[12px] leading-4',
                      step.state === 'current'
                        ? 'font-semibold text-foreground'
                        : step.state === 'error'
                          ? 'font-medium text-tone-danger-fg'
                          : step.state === 'done'
                            ? 'text-foreground'
                            : 'text-text-muted',
                    )}
                  >
                    {step.title}
                  </span>
                  {step.state === 'current' && step.hint && (
                    <span className="mt-0.5 block text-[11px] leading-4 text-text-faint">
                      {step.hint}
                    </span>
                  )}
                  {disabled && (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-text-faint">
                      <Lock className="size-2.5" />
                      غير مطلوب لهذا النوع
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function StepMarker({ state, num }: { state: WizardStepState; num: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative z-10 mt-px grid size-[22px] shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition-colors',
        state === 'done' && 'border-foreground bg-foreground text-background',
        state === 'current' && 'border-foreground bg-background text-foreground',
        state === 'error' && 'border-tone-danger-border bg-tone-danger-bg text-tone-danger-fg',
        (state === 'upcoming' || state === 'skipped') &&
          'border-border bg-background text-text-faint',
      )}
    >
      {state === 'done' ? (
        <Check className="size-3" strokeWidth={3} />
      ) : state === 'error' ? (
        <AlertCircle className="size-3" />
      ) : (
        num
      )}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Live summary                                                               */
/* -------------------------------------------------------------------------- */

export type WizardSummaryData = {
  name?: string
  categoryName?: string
  storeName?: string
  images: string[]
  productType: 'simple' | 'with_variants'
  price?: number
  stock?: number
  variantCount: number
  attributeCount: number
  isActive: boolean
  formatPrice: (n?: number) => string
  /** Clarifies which price is being shown — the wizard collects merchant price. */
  priceCaption?: string
}

/**
 * Mirrors what the shopper will see, updating as the form changes. Its job is
 * to make the Review step a confirmation rather than a discovery.
 */
export function WizardSummary({ data }: { data: WizardSummaryData }) {
  const cover = data.images[0]

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <Meta>معاينة مباشرة</Meta>
      </div>

      <div className="p-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-[6px] border border-border bg-canvas">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              sizes="280px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center text-text-faint">
              <div className="flex flex-col items-center gap-1.5">
                <ImageOff className="size-5" />
                <span className="text-[11px]">لا توجد صورة بعد</span>
              </div>
            </div>
          )}
          {data.images.length > 1 && (
            <span className="absolute bottom-1.5 end-1.5 rounded-[4px] bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white nums">
              +{data.images.length - 1}
            </span>
          )}
        </div>

        <p
          className={cn(
            'mt-2.5 line-clamp-2 text-[13px] font-medium leading-5',
            data.name ? 'text-foreground' : 'text-text-faint',
          )}
        >
          {data.name || 'اسم المنتج'}
        </p>

        <p className="mt-0.5 text-[15px] font-semibold text-foreground nums">
          {data.price ? data.formatPrice(data.price) : '—'}
        </p>
        {data.priceCaption && (
          <p className="mt-0.5 text-[10px] leading-4 text-text-faint">{data.priceCaption}</p>
        )}
      </div>

      <dl className="border-t border-border px-3 py-2">
        <SummaryRow label="النوع">
          {data.productType === 'simple' ? 'منتج بسيط' : 'منتج بمتغيرات'}
        </SummaryRow>
        <SummaryRow label="التصنيف">{data.categoryName || '—'}</SummaryRow>
        {data.storeName !== undefined && (
          <SummaryRow label="المتجر">{data.storeName || '—'}</SummaryRow>
        )}
        {data.productType === 'simple' ? (
          <SummaryRow label="المخزون">{data.stock ?? 0}</SummaryRow>
        ) : (
          <>
            <SummaryRow label="السمات">{data.attributeCount}</SummaryRow>
            <SummaryRow label="المتغيرات">{data.variantCount}</SummaryRow>
          </>
        )}
        <SummaryRow label="الصور">{data.images.length}</SummaryRow>
        <SummaryRow label="الحالة">
          <span className={data.isActive ? 'text-tone-success-fg' : 'text-text-muted'}>
            {data.isActive ? 'منشور' : 'مسودة'}
          </span>
        </SummaryRow>
      </dl>
    </div>
  )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="shrink-0 text-[11px] text-text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-[11px] font-medium text-foreground nums">{children}</dd>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Contextual help                                                            */
/* -------------------------------------------------------------------------- */

/** Short, step-scoped guidance. Sits under the rail, never in a modal. */
export function WizardHelp({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-canvas p-3">
      <p className="text-[11px] font-semibold text-foreground">{title}</p>
      <div className="mt-1 space-y-1 text-[11px] leading-[17px] text-text-muted">{children}</div>
    </div>
  )
}
