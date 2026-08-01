'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Banknote } from 'lucide-react'
import { toast } from 'sonner'

import {
  Alert,
  Button,
  Code,
  DataTable,
  EmptyState,
  Page,
  PageBody,
  PageHeader,
  Section,
  Stack,
  Stat,
  StatRow,
  StatusBadge,
  type Column,
  type Tone,
} from '@/components/admin'
import { Field, Textarea } from '@/components/admin/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/currency'

/* ============================================================================
   Affiliate commissions
   ----------------------------------------------------------------------------
   Endpoints unchanged: GET /api/admin/commissions and
   PATCH /api/admin/commissions/:id/pay with optional notes.

   Fixed while rebuilding:
     · The "تصفية" button had no handler — a filter control that filtered
       nothing. Replaced with a working status filter.
     · The "تم دفعه (الشهر الحالي)" card summed every paid commission ever, not
       the current month. Relabelled to match what it actually computes rather
       than faking a date range the endpoint doesn't provide.
   ========================================================================== */

type Commission = {
  _id: string
  amount: number
  orderAmount: number
  status: string
  createdAt: string
  notes?: string
  marketer?: { code?: string; name?: string }
  order?: { orderNumber?: string }
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'تم الدفع',
  pending: 'قيد الانتظار',
  approved: 'معتمد',
  rejected: 'مرفوض',
}

const STATUS_TONE: Record<string, Tone> = {
  paid: 'success',
  pending: 'warning',
  approved: 'info',
  rejected: 'danger',
}

const dateFmt = new Intl.DateTimeFormat('ar-SD-u-nu-latn', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export default function CommissionsAdminPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [payoutDialog, setPayoutDialog] = useState<{
    open: boolean
    commission: Commission | null
  }>({ open: false, commission: null })
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/commissions')
      const data = await res.json()
      if (res.ok) {
        setCommissions(data.data || [])
      } else {
        toast.error('فشل تحميل قائمة العمولات')
      }
    } catch {
      toast.error('خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCommissions()
  }, [fetchCommissions])

  const handlePayout = async () => {
    if (!payoutDialog.commission) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/commissions/${payoutDialog.commission._id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (res.ok) {
        toast.success('تم تأكيد دفع العمولة بنجاح')
        setPayoutDialog({ open: false, commission: null })
        setNotes('')
        fetchCommissions()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message || 'فشل تأكيد الدفع')
      }
    } catch {
      toast.error('خطأ أثناء معالجة الطلب')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingTotal = useMemo(
    () =>
      commissions
        .filter((c) => c.status === 'pending')
        .reduce((acc, c) => acc + (c.amount || 0), 0),
    [commissions],
  )
  const paidTotal = useMemo(
    () =>
      commissions.filter((c) => c.status === 'paid').reduce((acc, c) => acc + (c.amount || 0), 0),
    [commissions],
  )
  const pendingCount = commissions.filter((c) => c.status === 'pending').length

  const rows = useMemo(
    () => (statusFilter === 'all' ? commissions : commissions.filter((c) => c.status === statusFilter)),
    [commissions, statusFilter],
  )

  const columns = useMemo<Column<Commission>[]>(
    () => [
      {
        id: 'marketer',
        header: 'المسوق',
        width: '180px',
        cell: (c) => (
          <span className="font-medium text-foreground">
            {c.marketer?.name || `@${c.marketer?.code ?? '—'}`}
          </span>
        ),
      },
      {
        id: 'order',
        header: 'رقم الطلب',
        width: '130px',
        cell: (c) => <Code>{c.order?.orderNumber ?? '—'}</Code>,
      },
      {
        id: 'orderAmount',
        header: 'قيمة الطلب',
        width: '120px',
        align: 'end',
        cell: (c) => formatCurrency(c.orderAmount),
      },
      {
        id: 'amount',
        header: 'العمولة',
        width: '120px',
        align: 'end',
        sortable: true,
        cell: (c) => <span className="font-semibold">{formatCurrency(c.amount)}</span>,
      },
      {
        id: 'createdAt',
        header: 'التاريخ',
        width: '120px',
        cell: (c) => (
          <span className="whitespace-nowrap text-text-muted">
            {c.createdAt ? dateFmt.format(new Date(c.createdAt)) : '—'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'الحالة',
        width: '120px',
        cell: (c) => (
          <StatusBadge
            tone={STATUS_TONE[c.status] ?? 'neutral'}
            label={STATUS_LABEL[c.status] ?? c.status}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        width: '110px',
        align: 'end',
        hideable: false,
        truncate: false,
        cell: (c) =>
          c.status === 'pending' ? (
            <Button
              variant="secondary"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setPayoutDialog({ open: true, commission: c })
              }}
            >
              تأكيد الدفع
            </Button>
          ) : (
            <span className="text-text-faint">—</span>
          ),
      },
    ],
    [],
  )

  return (
    <Page>
      <PageHeader
        title="العمولات والمدفوعات"
        description="صرف عمولات المسوقين ومتابعة طلبات السحب."
      />

      <PageBody>
        <Stack gap="lg">
          <StatRow columns={3}>
            <Stat
              label="بانتظار الصرف"
              value={formatCurrency(pendingTotal)}
              hint={`${pendingCount} عمولة تتطلب تأكيد دفع`}
              emphasis={pendingTotal > 0}
              loading={loading}
            />
            <Stat
              label="إجمالي المدفوع"
              value={formatCurrency(paidTotal)}
              hint="كل المدفوعات المسجَّلة"
              loading={loading}
            />
            <Stat
              label="عدد العمولات"
              value={commissions.length}
              hint="في السجل الحالي"
              loading={loading}
            />
          </StatRow>

          <Section
            title="سجل العمولات"
            variant="panel"
            flush
            actions={
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'pending', label: 'قيد الانتظار' },
                  { id: 'paid', label: 'مدفوعة' },
                ].map((f) => (
                  <Button
                    key={f.id}
                    size="xs"
                    variant={statusFilter === f.id ? 'primary' : 'ghost'}
                    onClick={() => setStatusFilter(f.id)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            }
          >
            <DataTable
              data={rows}
              columns={columns}
              getRowId={(c) => c._id}
              loading={loading}
              empty={
                <EmptyState
                  icon={<Banknote className="size-4" />}
                  title={statusFilter === 'all' ? 'لا توجد عمولات' : 'لا نتائج بهذه الحالة'}
                  description={
                    statusFilter === 'all'
                      ? 'ستظهر العمولات هنا فور تسجيل أول عملية بيع عبر مسوق.'
                      : 'جرّب حالة أخرى لعرض بقية السجل.'
                  }
                />
              }
            />
          </Section>
        </Stack>
      </PageBody>

      <Dialog
        open={payoutDialog.open}
        onOpenChange={(open) => !open && setPayoutDialog({ open, commission: null })}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد صرف العمولة</DialogTitle>
            <DialogDescription>
              سيُسجَّل أنك حوّلت العمولة للمسوق{' '}
              <strong>{payoutDialog.commission?.marketer?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg border border-border bg-canvas px-3.5 py-3">
              <span className="text-[12px] text-text-muted">المبلغ المستحق</span>
              <span className="text-[20px] font-semibold text-foreground nums">
                {formatCurrency(payoutDialog.commission?.amount || 0)}
              </span>
            </div>

            <Field label="ملاحظات (اختياري)">
              <Textarea
                placeholder="تفاصيل التحويل أو ملاحظات إضافية…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            <Alert tone="warning">
              <span className="flex items-start gap-2">
                <AlertCircle className="mt-px size-3.5 shrink-0" />
                تأكد من إتمام التحويل الفعلي للمبلغ قبل الضغط على زر التأكيد — لا يمكن التراجع
                عن هذا التسجيل.
              </span>
            </Alert>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setPayoutDialog({ open: false, commission: null })}
            >
              إلغاء
            </Button>
            <Button variant="primary" size="md" loading={submitting} onClick={handlePayout}>
              تأكيد الصرف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  )
}
