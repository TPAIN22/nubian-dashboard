import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================================
   Page layout system
   ----------------------------------------------------------------------------
   Every admin route composes from exactly these pieces. No page invents its own
   padding, title size or max width — that is what made the old dashboard feel
   like fifteen different products stapled together.

     <Page>
       <PageHeader breadcrumbs={…} title="…" actions={…} />
       <PageBody>
         <Section title="…"> … </Section>
       </PageBody>
     </Page>

   The layout is RTL-native: logical properties (ms/me/ps/pe, start/end) only.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Full-height column. Owns scrolling so the header and any sticky action bar
 * can pin without the whole document moving.
 */
export function Page({ className, children }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>{children}</div>
  )
}

/* -------------------------------------------------------------------------- */
/* Breadcrumbs                                                                */
/* -------------------------------------------------------------------------- */

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null
  return (
    <nav aria-label="مسار التنقل" className="flex min-w-0 items-center gap-1 text-[12px]">
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {i > 0 && (
              <ChevronLeft
                aria-hidden
                className="size-3.5 shrink-0 text-text-faint rtl:rotate-180"
              />
            )}
            {item.href && !last ? (
              <Link
                href={item.href}
                className="truncate rounded-[3px] px-0.5 text-text-muted transition-colors hover:text-foreground focus-ring"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn('truncate px-0.5', last ? 'text-foreground' : 'text-text-muted')}
                aria-current={last ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/* PageHeader                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Note: there is deliberately no `breadcrumbs` prop. The trail is rendered once,
 * in the topbar, derived from the route (see shell/breadcrumbs.tsx). Two trails
 * on one screen is the kind of duplication that made the old header 140px tall.
 */
type PageHeaderProps = {
  title: React.ReactNode
  /** One short line. Skip it unless it genuinely adds information. */
  description?: React.ReactNode
  /** Status badge / id chip rendered inline beside the title. */
  meta?: React.ReactNode
  /** Primary + secondary actions, end-aligned on the title row. */
  actions?: React.ReactNode
  /** Tabs or a filter strip. Sits flush under the header on its own hairline. */
  tabs?: React.ReactNode
  /** Back affordance for detail pages. */
  backHref?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  meta,
  actions,
  tabs,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'shrink-0 border-b border-border bg-background',
        // Sticks under the 48px topbar when the body scrolls.
        'sticky top-0 z-20',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-(--page-max) px-6 pt-4 pb-3">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-2.5">
            {backHref && (
              <Link
                href={backHref}
                aria-label="رجوع"
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[5px] border border-border text-text-muted transition-colors hover:bg-canvas-hover hover:text-foreground focus-ring"
              >
                <ChevronLeft className="size-4 rtl:rotate-180" />
              </Link>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 className="truncate text-[20px] font-semibold leading-7 tracking-[-0.011em] text-foreground">
                  {title}
                </h1>
                {meta}
              </div>
              {description && (
                <p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-muted">
                  {description}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex shrink-0 items-center gap-2 pt-0.5">{actions}</div>
          )}
        </div>
      </div>

      {tabs && (
        <div className="mx-auto w-full max-w-(--page-max) px-6">{tabs}</div>
      )}
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* PageBody                                                                   */
/* -------------------------------------------------------------------------- */

type PageBodyProps = React.ComponentProps<'div'> & {
  /**
   * `default` — centred content column with page gutters.
   * `flush`   — no padding; for full-bleed tables that manage their own edges.
   * `narrow`  — 46rem reading/form column, centred.
   */
  variant?: 'default' | 'flush' | 'narrow'
}

export function PageBody({
  variant = 'default',
  className,
  children,
  ...props
}: PageBodyProps) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto quiet-scroll', className)} {...props}>
      <div
        className={cn(
          'mx-auto w-full',
          variant === 'flush' && 'max-w-(--page-max)',
          variant === 'default' && 'max-w-(--page-max) px-6 py-5',
          variant === 'narrow' && 'max-w-3xl px-6 py-6',
        )}
      >
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

type SectionProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  /** End-aligned controls on the section heading row. */
  actions?: React.ReactNode
  /**
   * `plain`  — heading + content, separated by whitespace. The default; use it
   *            for most groupings. Cards are the exception, not the rule.
   * `panel`  — bordered surface. Only when the content needs a real boundary
   *            (tables, lists, anything with internal rows).
   */
  variant?: 'plain' | 'panel'
  /** Removes panel padding — for tables that draw their own row padding. */
  flush?: boolean
  className?: string
  contentClassName?: string
  children?: React.ReactNode
  id?: string
}

export function Section({
  title,
  description,
  actions,
  variant = 'plain',
  flush = false,
  className,
  contentClassName,
  children,
  id,
}: SectionProps) {
  const heading = (title || actions || description) && (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        variant === 'panel' && !flush && 'mb-3',
        variant === 'panel' && flush && 'border-b border-border px-4 py-2.5',
        variant === 'plain' && 'mb-3',
      )}
    >
      <div className="min-w-0">
        {title && (
          <h2 className="text-[13px] font-semibold leading-5 tracking-[-0.006em] text-foreground">
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-0.5 text-[12px] leading-[18px] text-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  )

  if (variant === 'panel') {
    return (
      <section
        id={id}
        className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}
      >
        {flush ? heading : <div className="p-4">{heading}</div>}
        <div className={cn(!flush && 'px-4 pb-4', contentClassName)}>{children}</div>
      </section>
    )
  }

  return (
    <section id={id} className={className}>
      {heading}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}

/**
 * Vertical rhythm between sections. One knob, so every page breathes the same.
 */
export function Stack({
  gap = 'md',
  className,
  children,
}: {
  gap?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col',
        gap === 'sm' && 'gap-3',
        gap === 'md' && 'gap-5',
        gap === 'lg' && 'gap-8',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Split — main column + sticky aside                                         */
/* -------------------------------------------------------------------------- */

/**
 * The Shopify detail-page shape: a wide primary column and a narrower aside
 * that sticks while the primary scrolls. Collapses to a single column below xl.
 */
export function Split({
  aside,
  asideWidth = 'md',
  className,
  children,
}: {
  aside: React.ReactNode
  asideWidth?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('grid grid-cols-1 items-start gap-6 xl:grid-cols-12', className)}>
      <div className={cn('min-w-0', asideWidth === 'sm' ? 'xl:col-span-9' : 'xl:col-span-8')}>
        {children}
      </div>
      <aside
        className={cn(
          'min-w-0 xl:sticky xl:top-4',
          asideWidth === 'sm' ? 'xl:col-span-3' : 'xl:col-span-4',
        )}
      >
        {aside}
      </aside>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* StickyBar — the save/discard rail                                          */
/* -------------------------------------------------------------------------- */

/**
 * Pins to the bottom of the page while a form is dirty. Replaces the "scroll to
 * the bottom to find Save" pattern that every admin template ships with.
 */
export function StickyBar({
  visible = true,
  status,
  children,
  className,
}: {
  visible?: boolean
  /** Left-aligned status text — "غير محفوظ", "تم الحفظ تلقائياً", validation summary. */
  status?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-visible={visible}
      className={cn(
        'sticky bottom-0 z-30 shrink-0 border-t border-border bg-background/85 backdrop-blur-md',
        'transition-[transform,opacity] duration-200 ease-out',
        'data-[visible=false]:pointer-events-none data-[visible=false]:translate-y-full data-[visible=false]:opacity-0',
        className,
      )}
      style={{ boxShadow: visible ? 'var(--elev-bar)' : undefined }}
    >
      <div className="mx-auto flex w-full max-w-(--page-max) items-center justify-between gap-4 px-6 py-2.5">
        <div className="min-w-0 truncate text-[12px] text-text-muted">{status}</div>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Misc text primitives                                                       */
/* -------------------------------------------------------------------------- */

/** Small uppercase-ish label used above dense value groups. */
export function Meta({ className, children }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('text-[11px] font-medium leading-4 text-text-faint', className)}>
      {children}
    </div>
  )
}

/** Definition row: label on one side, value on the other. Dense detail panels. */
export function DetailRow({
  label,
  children,
  className,
}: {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 py-1.5', className)}>
      <dt className="shrink-0 text-[12px] text-text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-[12px] font-medium text-foreground nums">{children}</dd>
    </div>
  )
}

/** Hairline separator with optional inline label. */
export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) return <hr className={cn('border-0 border-t border-border', className)} />
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <hr className="flex-1 border-0 border-t border-border" />
      <span className="text-[11px] font-medium text-text-faint">{label}</span>
      <hr className="flex-1 border-0 border-t border-border" />
    </div>
  )
}
