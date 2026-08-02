'use client'

import * as React from 'react'
import { use } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SendHorizontal } from 'lucide-react'

import {
  Button,
  Code,
  DetailRow,
  ErrorState,
  Page,
  PageBody,
  PageHeader,
  Section,
  Skeleton,
  Split,
  Stack,
  StatusBadge,
  Textarea,
} from '@/components/admin'
import { useSetPageLabel } from '@/components/console/shell'
import { toneFor } from '@/components/admin/tone'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import {
  merchantKeys,
  merchantRequest,
  useInvalidateMerchant,
  useMerchantTicket,
  type TicketMessage,
} from '@/features/merchant/api'

/* ============================================================================
   Ticket detail
   ----------------------------------------------------------------------------
   A conversation, not a stack of cards. The thread reads like a thread —
   merchant replies on one side, everyone else on the other — and the composer
   is pinned under it rather than floating in the middle of a card.
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

const time = (value?: string) =>
  value
    ? new Date(value).toLocaleString('en-CA', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : ''

export default function MerchantTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const ticket = useMerchantTicket(id)
  const invalidate = useInvalidateMerchant()
  const [reply, setReply] = React.useState('')

  // Replaces the raw id in the topbar breadcrumb with the ticket number.
  useSetPageLabel(ticket.data?.ticketNumber)

  const send = useMutation({
    mutationFn: (message: string) =>
      merchantRequest(`/api/merchant/tickets/${encodeURIComponent(id)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    onSuccess: async () => {
      setReply('')
      await invalidate([merchantKeys.ticket(id)])
      toast.success('تم إرسال الرد')
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر إرسال الرد'),
  })

  const t = ticket.data

  // The opening description is the first message in the conversation, so it
  // renders as one — showing it twice (as a "Description" card *and* as the
  // first bubble) is what made the old page feel duplicated.
  const thread: TicketMessage[] = React.useMemo(() => {
    if (!t) return []
    return [
      { message: t.description, senderRole: 'customer', createdAt: t.createdAt },
      ...(t.messages ?? []),
    ]
  }, [t])

  if (ticket.isError) {
    return (
      <Page>
        <PageHeader title="التذكرة" backHref="/merchant/support" />
        <PageBody>
          <ErrorState
            size="page"
            title="تعذر تحميل التذكرة"
            description="قد تكون التذكرة غير موجودة أو ليست ضمن صلاحياتك."
            onRetry={() => ticket.refetch()}
          />
        </PageBody>
      </Page>
    )
  }

  const customerName = t?.userId?.fullName || 'العميل'
  const orderNumber = t?.relatedOrderId?.orderNumber
  const orderAmount = t?.relatedOrderId?.totalAmount

  return (
    <Page>
      <PageHeader
        backHref="/merchant/support"
        title={ticket.isLoading ? 'جارٍ التحميل…' : t?.subject || 'تذكرة'}
        meta={
          t?.status && (
            <StatusBadge
              variant="chip"
              tone={toneFor(t.status)}
              label={STATUS_LABELS[t.status] ?? t.status}
            />
          )
        }
        description={
          t && (
            <span className="inline-flex items-center gap-2">
              <Code>{t.ticketNumber}</Code>
              <span>أُنشئت {time(t.createdAt)}</span>
            </span>
          )
        }
      />

      <PageBody>
        {ticket.isLoading ? (
          <ThreadSkeleton />
        ) : (
          <Split
            asideWidth="sm"
            aside={
              <Stack gap="sm">
                <Section title="العميل" variant="panel">
                  <dl>
                    <DetailRow label="الاسم">{customerName}</DetailRow>
                  </dl>
                </Section>

                <Section title="الطلب المرتبط" variant="panel">
                  <dl>
                    <DetailRow label="رقم الطلب">
                      {orderNumber ? <Code>{orderNumber}</Code> : '—'}
                    </DetailRow>
                    <DetailRow label="قيمة الطلب">
                      {typeof orderAmount === 'number' ? formatCurrency(orderAmount) : '—'}
                    </DetailRow>
                  </dl>
                </Section>
              </Stack>
            }
          >
            <Section title="المحادثة" variant="panel" flush>
              <div className="space-y-3 p-4">
                {thread.map((msg, i) => (
                  <Message key={msg._id || i} message={msg} customerName={customerName} />
                ))}
              </div>

              <div className="border-t border-border p-3">
                <Textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="اكتب ردك هنا…"
                  disabled={send.isPending}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-text-muted">يظهر ردك للعميل ولفريق الدعم.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={send.isPending}
                    disabled={!reply.trim()}
                    onClick={() => send.mutate(reply.trim())}
                  >
                    <SendHorizontal className="rtl:rotate-180" />
                    إرسال
                  </Button>
                </div>
              </div>
            </Section>
          </Split>
        )}
      </PageBody>
    </Page>
  )
}

function Message({ message, customerName }: { message: TicketMessage; customerName: string }) {
  const mine = message.senderRole === 'merchant'
  const author = mine
    ? 'أنت'
    : message.senderId?.fullName ||
      (message.senderRole === 'customer' ? customerName : 'فريق الدعم')

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg border px-3 py-2',
          mine ? 'border-tone-info-border bg-tone-info-bg' : 'border-border bg-canvas',
        )}
      >
        <p
          className={cn(
            'text-[11px] font-semibold',
            mine ? 'text-tone-info-fg' : 'text-text-muted',
          )}
        >
          {author}
        </p>
        <p className="mt-0.5 text-[12px] leading-5 whitespace-pre-line text-foreground">
          {message.message}
        </p>
        <p className="mt-1 text-[10px] text-text-faint nums" dir="ltr">
          {time(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

function ThreadSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-3 xl:col-span-9">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={cn('h-16', i % 2 ? 'ms-auto w-2/3' : 'w-3/4')} />
        ))}
      </div>
      <div className="space-y-3 xl:col-span-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  )
}
