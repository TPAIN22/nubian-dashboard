'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CircleSlash,
  Clock,
  PencilLine,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import { Alert, Button, Section, Skeleton, StatusBadge, type Tone } from '@/components/admin'
import { merchantRequest, useMerchantStatus, type MerchantRecord } from '@/features/merchant/api'

/* ============================================================================
   Application status
   ----------------------------------------------------------------------------
   One screen, four outcomes. The old version was four near-identical 60-line
   blocks of copy-pasted markup — each with its own icon circle, its own colour
   literals and its own subtly different heading size — plus a fifth "unknown"
   fallback whose condition overlapped the others, so a NEEDS_REVISION applicant
   saw two panels at once.

   Now the state is looked up in one table and rendered once.
   ========================================================================== */

type StatusView = {
  tone: Tone
  icon: LucideIcon
  title: string
  body: (store: MerchantRecord) => React.ReactNode
  /** Reason text the reviewer left, if this state carries one. */
  note?: (store: MerchantRecord) => string | undefined
  noteLabel?: string
  primary?: { label: string; href: string }
  /** Withdrawing deletes the application so a fresh one can be filed. */
  withdraw?: 'primary' | 'secondary'
}

const STATUS_VIEWS: Record<string, StatusView> = {
  PENDING: {
    tone: 'warning',
    icon: Clock,
    title: 'طلبك قيد المراجعة',
    body: (s) => (
      <>
        طلب فتح متجر <strong className="font-medium text-foreground">{s.storeName}</strong> وصلنا
        وفريقنا يراجعه الآن. عادةً ما يستغرق ذلك يوم إلى يومي عمل، وسنخطرك فور صدور القرار.
      </>
    ),
    withdraw: 'secondary',
  },
  NEEDS_REVISION: {
    tone: 'warning',
    icon: PencilLine,
    title: 'طلبك يحتاج تعديلات',
    body: (s) => (
      <>
        راجع فريقنا طلب متجر <strong className="font-medium text-foreground">{s.storeName}</strong>{' '}
        وطلب بعض التعديلات. بياناتك محفوظة — عدّل المطلوب فقط وأعد الإرسال.
      </>
    ),
    note: (s) => s.revisionNotes,
    noteLabel: 'ملاحظات فريق المراجعة',
    primary: { label: 'تعديل الطلب وإعادة الإرسال', href: '/merchant/apply' },
  },
  REJECTED: {
    tone: 'danger',
    icon: XCircle,
    title: 'لم يُقبل الطلب',
    body: (s) => (
      <>
        لم نتمكن من اعتماد طلب متجر{' '}
        <strong className="font-medium text-foreground">{s.storeName}</strong> هذه المرة. يمكنك
        مراجعة البيانات وتقديم طلب جديد.
      </>
    ),
    note: (s) => s.rejectionReason,
    noteLabel: 'سبب الرفض',
    primary: { label: 'التقديم مرة أخرى', href: '/merchant/apply' },
    withdraw: 'secondary',
  },
  SUSPENDED: {
    tone: 'danger',
    icon: CircleSlash,
    title: 'حسابك التجاري معلّق',
    body: (s) => (
      <>
        تم تعليق متجر{' '}
        <strong className="font-medium text-foreground">{s.storeName || 'الخاص بك'}</strong> مؤقتاً.
        لا يمكنك إدارة المنتجات أو الطلبات، ومنتجاتك مخفية عن العملاء حتى يُرفع التعليق.
      </>
    ),
    note: (s) => s.suspensionReason,
    noteLabel: 'سبب التعليق',
  },
}

const FALLBACK: StatusView = {
  tone: 'neutral',
  icon: AlertTriangle,
  title: 'حالة غير معروفة',
  body: (s) => (
    <>
      حالة حسابك التجاري حالياً: <strong className="font-medium text-foreground">{s.status}</strong>
      . يرجى التواصل مع الدعم للاستفسار.
    </>
  ),
}

export default function MerchantPendingPage() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useMerchantStatus()

  const store = data?.application
  const state = store?.status?.toUpperCase()

  React.useEffect(() => {
    if (!data) return
    if (!data.hasApplication) router.replace('/merchant/apply')
    else if (state === 'APPROVED') router.replace('/merchant/dashboard')
  }, [data, state, router])

  const withdraw = useMutation({
    mutationFn: () => merchantRequest('/api/merchant/my-application', { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('تم سحب الطلب')
      router.replace('/merchant/apply')
      router.refresh()
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر سحب الطلب'),
  })

  const [confirmWithdraw, setConfirmWithdraw] = React.useState(false)

  if (isLoading) return <StatusSkeleton />

  if (isError || !store) {
    return (
      <Section variant="panel" className="text-center">
        <p className="text-[13px] font-semibold text-foreground">تعذر تحميل حالة الطلب</p>
        <p className="mt-1 text-[12px] text-text-muted">تحقق من اتصالك وحاول مرة أخرى.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
          إعادة المحاولة
        </Button>
      </Section>
    )
  }

  const view = (state && STATUS_VIEWS[state]) || FALLBACK
  const Icon = view.icon
  const note = view.note?.(store)

  return (
    <Section variant="panel">
      <div className="flex items-start gap-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-lg border ${toneChip(view.tone)}`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[17px] font-semibold tracking-[-0.011em] text-foreground">
              {view.title}
            </h1>
            <StatusBadge variant="chip" tone={view.tone} label={statusLabel(state)} />
          </div>
          <p className="mt-1.5 text-[13px] leading-6 text-text-muted">{view.body(store)}</p>
        </div>
      </div>

      {note && (
        <Alert tone={view.tone} title={view.noteLabel} className="mt-5">
          {note}
        </Alert>
      )}

      <dl className="mt-5 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="text-[12px] text-text-muted">تاريخ التقديم</dt>
          <dd className="text-[12px] font-medium text-foreground nums">
            {store.createdAt ? new Date(store.createdAt).toLocaleDateString('en-CA') : '—'}
          </dd>
        </div>
        {store.suspendedAt && (
          <div className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-[12px] text-text-muted">تاريخ التعليق</dt>
            <dd className="text-[12px] font-medium text-foreground nums">
              {new Date(store.suspendedAt).toLocaleDateString('en-CA')}
            </dd>
          </div>
        )}
      </dl>

      {(view.primary || view.withdraw) && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {view.primary && (
            <Button variant="primary" size="md" onClick={() => router.push(view.primary!.href)}>
              {view.primary.label}
            </Button>
          )}
          {view.withdraw && !confirmWithdraw && (
            <Button variant="ghost" size="md" onClick={() => setConfirmWithdraw(true)}>
              سحب الطلب
            </Button>
          )}
        </div>
      )}

      {confirmWithdraw && (
        <Alert
          tone="danger"
          title="سحب الطلب نهائياً؟"
          className="mt-3"
          action={
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={withdraw.isPending}
                onClick={() => setConfirmWithdraw(false)}
              >
                تراجع
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={withdraw.isPending}
                onClick={() => withdraw.mutate()}
              >
                سحب
              </Button>
            </div>
          }
        >
          سيُحذف طلبك الحالي بالكامل ويمكنك تقديم طلب جديد من البداية.
        </Alert>
      )}

      <p className="mt-5 text-[11px] text-text-faint">
        لأي استفسار عن حالة طلبك، تواصل مع فريق نُوبيان.
      </p>
    </Section>
  )
}

function statusLabel(state?: string) {
  switch (state) {
    case 'PENDING':
      return 'قيد المراجعة'
    case 'NEEDS_REVISION':
      return 'يتطلب تعديلاً'
    case 'REJECTED':
      return 'مرفوض'
    case 'SUSPENDED':
      return 'معلّق'
    default:
      return state || '—'
  }
}

function toneChip(tone: Tone) {
  return {
    neutral: 'border-tone-neutral-border bg-tone-neutral-bg text-tone-neutral-fg',
    success: 'border-tone-success-border bg-tone-success-bg text-tone-success-fg',
    warning: 'border-tone-warning-border bg-tone-warning-bg text-tone-warning-fg',
    danger: 'border-tone-danger-border bg-tone-danger-bg text-tone-danger-fg',
    info: 'border-tone-info-border bg-tone-info-bg text-tone-info-fg',
    brand: 'border-tone-brand-border bg-tone-brand-bg text-tone-brand-fg',
  }[tone]
}

function StatusSkeleton() {
  return (
    <Section variant="panel">
      <div className="flex items-start gap-4">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-2/3" />
        </div>
      </div>
      <Skeleton className="mt-5 h-14 w-full" />
    </Section>
  )
}
