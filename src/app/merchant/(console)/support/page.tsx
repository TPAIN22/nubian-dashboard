'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LifeBuoy, Plus, RefreshCw } from 'lucide-react'

import {
  Button,
  CellEmpty,
  CellTitle,
  ClearFilters,
  Code,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  FieldGrid,
  Filter,
  ListSkeleton,
  Page,
  PageBody,
  PageHeader,
  SearchInput,
  Section,
  Select,
  StatusBadge,
  Textarea,
  Input,
  Toolbar,
  ToolbarDivider,
  ToolbarSpacer,
  useColumnVisibility,
  type Column,
} from '@/components/admin'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toneFor } from '@/components/admin/tone'
import {
  merchantRequest,
  useInvalidateMerchant,
  useMerchantTickets,
  type MerchantTicket,
} from '@/features/merchant/api'

/* ============================================================================
   Support
   ----------------------------------------------------------------------------
   The old page shipped a <Tabs> with exactly one tab, a bespoke chain of
   ternaries for status colours, and a filter bar that fired a fresh request on
   every keystroke. This is the same list on the shared table, with the status
   vocabulary going through the canonical tone map so a "مصعدة" ticket is the
   same red here as everywhere else in the product.
   ========================================================================== */

const STATUS_LABELS: Record<string, string> = {
  open: 'مفتوحة',
  under_review: 'قيد المراجعة',
  waiting_customer: 'بانتظار العميل',
  escalated: 'مصعدة',
  resolved_refund: 'تم الاسترداد',
  resolved_rejected: 'مرفوضة',
  closed: 'مغلقة',
}

const CATEGORY_LABELS: Record<string, string> = {
  order_issue: 'مشاكل الطلب',
  payment_issue: 'مشاكل الدفع',
  merchant_complaint: 'شكوى تاجر',
  product_report: 'بلاغ منتج',
  fraud: 'احتيال',
  health_risk: 'مخاطر صحية',
  other: 'أخرى',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
}

const label = (map: Record<string, string>, key?: string) =>
  (key && map[key]) || key?.replace(/_/g, ' ') || '—'

const columns: Column<MerchantTicket>[] = [
  {
    id: 'ticketNumber',
    header: 'المعرف',
    width: '110px',
    hideable: false,
    cell: (t) => <Code>{t.ticketNumber}</Code>,
  },
  {
    id: 'subject',
    header: 'الموضوع',
    hideable: false,
    cell: (t) => <CellTitle title={t.subject} subtitle={label(CATEGORY_LABELS, t.category)} />,
  },
  {
    id: 'status',
    header: 'الحالة',
    width: '140px',
    truncate: false,
    cell: (t) => <StatusBadge tone={toneFor(t.status)} label={label(STATUS_LABELS, t.status)} />,
  },
  {
    id: 'priority',
    header: 'الأولوية',
    width: '100px',
    cell: (t) => (
      <span
        className={t.priority === 'high' ? 'font-medium text-tone-danger-fg' : 'text-text-muted'}
      >
        {label(PRIORITY_LABELS, t.priority)}
      </span>
    ),
  },
  {
    id: 'createdAt',
    header: 'التاريخ',
    width: '110px',
    cell: (t) =>
      t.createdAt ? (
        <span className="text-text-muted nums">
          {new Date(t.createdAt).toLocaleDateString('en-CA')}
        </span>
      ) : (
        <CellEmpty />
      ),
  },
]

export default function MerchantSupportPage() {
  return (
    <React.Suspense fallback={<SupportFallback />}>
      <SupportView />
    </React.Suspense>
  )
}

function SupportFallback() {
  return (
    <Page>
      <PageHeader title="الدعم" description="الشكاوى والطلبات المتعلقة بمتجرك." />
      <PageBody variant="flush">
        <Section variant="panel" flush className="m-4 rounded-lg">
          <ListSkeleton rows={6} />
        </Section>
      </PageBody>
    </Page>
  )
}

function SupportView() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = React.useState('')
  const [status, setStatus] = React.useState('all')
  const [category, setCategory] = React.useState('all')
  // The ⌘K palette links here with ?new=1 to open the composer directly.
  const [composerOpen, setComposerOpen] = React.useState(searchParams.get('new') === '1')

  /**
   * Debounced: the old page put `searchTerm` straight into the effect deps and
   * fired a request per keystroke.
   */
  const debouncedQuery = useDebounced(query, 300)

  const params = React.useMemo(() => {
    const p: Record<string, string> = {}
    if (status !== 'all') p.status = status
    if (category !== 'all') p.category = category
    if (debouncedQuery) p.query = debouncedQuery
    return p
  }, [status, category, debouncedQuery])

  const tickets = useMerchantTickets(params)
  const { visible, menu } = useColumnVisibility(columns, 'merchant.tickets')

  const filtersActive = query !== '' || status !== 'all' || category !== 'all'
  const clearFilters = () => {
    setQuery('')
    setStatus('all')
    setCategory('all')
  }

  return (
    <Page>
      <PageHeader
        title="الدعم"
        description="الشكاوى والطلبات المتعلقة بمتجرك."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => tickets.refetch()}
              loading={tickets.isFetching && !tickets.isLoading}
              aria-label="تحديث"
            >
              <RefreshCw />
              تحديث
            </Button>
            <Button variant="primary" size="sm" onClick={() => setComposerOpen(true)}>
              <Plus />
              تذكرة جديدة
            </Button>
          </>
        }
      />

      <PageBody variant="flush">
        {tickets.isError ? (
          <ErrorState
            size="page"
            description={(tickets.error as Error)?.message}
            onRetry={() => tickets.refetch()}
          />
        ) : (
          <Section variant="panel" flush className="m-4 rounded-lg">
            <Toolbar>
              <SearchInput
                value={query}
                onValueChange={setQuery}
                placeholder="ابحث برقم التذكرة أو الموضوع…"
                className="w-full max-w-64"
              />
              <ToolbarDivider />
              <Filter
                label="الحالة"
                value={status}
                onValueChange={setStatus}
                options={[
                  { value: 'all', label: 'جميع الحالات' },
                  ...Object.entries(STATUS_LABELS).map(([value, l]) => ({ value, label: l })),
                ]}
              />
              <Filter
                label="الفئة"
                value={category}
                onValueChange={setCategory}
                options={[
                  { value: 'all', label: 'جميع الفئات' },
                  ...Object.entries(CATEGORY_LABELS).map(([value, l]) => ({ value, label: l })),
                ]}
              />
              {filtersActive && <ClearFilters onClear={clearFilters} />}
              <ToolbarSpacer />
              {menu}
            </Toolbar>

            <DataTable
              data={tickets.data ?? []}
              columns={columns}
              visibleColumns={visible}
              getRowId={(t) => t._id || t.ticketNumber}
              loading={tickets.isLoading}
              onRowClick={(t) => router.push(`/merchant/support/${t._id || t.ticketNumber}`)}
              rowAccent={(t) => (t.status === 'escalated' ? 'bg-tone-danger-fg' : undefined)}
              empty={
                <EmptyState
                  icon={<LifeBuoy className="size-4" />}
                  title={filtersActive ? 'لا توجد تذاكر مطابقة' : 'لا توجد تذاكر دعم'}
                  description={
                    filtersActive
                      ? 'جرّب توسيع البحث أو مسح الفلاتر.'
                      : 'إذا واجهت مشكلة في طلب أو دفعة، افتح تذكرة وسيتابعها فريقنا.'
                  }
                  action={
                    filtersActive ? (
                      <Button variant="secondary" size="sm" onClick={clearFilters}>
                        مسح الفلاتر
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => setComposerOpen(true)}>
                        <Plus />
                        تذكرة جديدة
                      </Button>
                    )
                  }
                />
              }
            />
          </Section>
        )}
      </PageBody>

      <TicketComposer open={composerOpen} onOpenChange={setComposerOpen} />
    </Page>
  )
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/* ============================================================================
   Composer
   ========================================================================== */

function TicketComposer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const invalidate = useInvalidateMerchant()
  const [type, setType] = React.useState('support')
  const [category, setCategory] = React.useState('payment_issue')
  const [priority, setPriority] = React.useState('medium')
  const [subject, setSubject] = React.useState('')
  const [description, setDescription] = React.useState('')

  const reset = () => {
    setType('support')
    setCategory('payment_issue')
    setPriority('medium')
    setSubject('')
    setDescription('')
  }

  const create = useMutation({
    mutationFn: () =>
      merchantRequest('/api/merchant/tickets', {
        method: 'POST',
        body: JSON.stringify({
          type,
          category,
          priority,
          subject: subject.trim(),
          description: description.trim(),
        }),
      }),
    onSuccess: async () => {
      await invalidate([['merchant', 'tickets']])
      toast.success('تم إنشاء التذكرة')
      reset()
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر إنشاء التذكرة'),
  })

  const canSubmit = subject.trim().length > 0 && description.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px]">تذكرة دعم جديدة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FieldGrid>
            <Field label="النوع">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="support">طلب دعم</option>
                <option value="complaint">شكوى</option>
                <option value="legal">قانوني</option>
              </Select>
            </Field>
            <Field label="الأولوية">
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {Object.entries(PRIORITY_LABELS).map(([value, l]) => (
                  <option key={value} value={value}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldGrid>

          <Field label="الفئة">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {['payment_issue', 'order_issue', 'product_report', 'other'].map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="الموضوع" required hint="ملخص قصير في سطر واحد.">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="مثال: لم تصلني قيمة الطلب #1042"
            />
          </Field>

          <Field label="الوصف" required>
            <Textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح المشكلة بالتفصيل، وأرفق أرقام الطلبات إن وُجدت…"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            إلغاء
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={create.isPending}
            disabled={!canSubmit}
            onClick={() => create.mutate()}
          >
            إرسال
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
