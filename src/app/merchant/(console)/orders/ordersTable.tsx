'use client'

import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ExternalLink, MoreHorizontal, PackageCheck, Truck } from 'lucide-react'

import {
  Button,
  CellEmpty,
  CellTitle,
  Code,
  DataTable,
  DetailRow,
  Divider,
  Section,
  StatusBadge,
  type Column,
} from '@/components/admin'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toneFor } from '@/components/admin/tone'
import { getOrderStatusMeta } from '@/app/admin/orders/orderStatus'
import { formatMoney, getOrderCurrency } from '@/app/admin/orders/types'
import {
  merchantKeys,
  merchantRequest,
  useInvalidateMerchant,
  type MerchantOrder,
} from '@/features/merchant/api'

/* ============================================================================
   Orders table
   ----------------------------------------------------------------------------
   Rows, the detail drawer and status transitions. Everything else — tabs,
   paging, refresh — belongs to the page.

   Status vocabulary note: the backend normalises PROCESSING→confirmed,
   AWAITING_PAYMENT_CONFIRMATION→pending and PAYMENT_FAILED→cancelled on write,
   so a single list response mixes SCREAMING_CASE and lowercase. Everything here
   goes through `getOrderStatusMeta` / `toneFor`, which key both vocabularies,
   rather than comparing raw strings.
   ========================================================================== */

/** The transitions the backend allows a merchant to perform. */
const MERCHANT_TRANSITIONS = [
  { value: 'confirmed', label: 'تأكيد الطلب', icon: Check },
  { value: 'shipped', label: 'تعليم كمشحون', icon: Truck },
  { value: 'delivered', label: 'تعليم كمُسلَّم', icon: PackageCheck },
] as const

/**
 * The single move that makes sense next, given where the order is in the
 * funnel. Surfacing one button beats a menu of three when two of them would be
 * a mistake.
 */
export function nextTransition(status: string) {
  const rank = getOrderStatusMeta(status).rank
  if (rank <= 0) return null // not started, or left the funnel entirely
  if (rank === 1) return MERCHANT_TRANSITIONS[0]
  if (rank === 2) return MERCHANT_TRANSITIONS[1]
  if (rank === 3) return MERCHANT_TRANSITIONS[2]
  return null
}

/* ============================================================================
   Mutations
   ========================================================================== */

/** Per-attempt idempotency key, so a double click can't double-apply. */
function statusKey(orderId: string) {
  const unique =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `merchant-status:${orderId}:${unique}`
}

export type OrderActions = ReturnType<typeof useOrderActions>

export function useOrderActions() {
  const invalidate = useInvalidateMerchant()
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const refresh = React.useCallback(
    () => invalidate([['merchant', 'orders'], merchantKeys.stats]),
    [invalidate],
  )

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      merchantRequest(`/api/orders/merchant/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Idempotency-Key': statusKey(id) },
        body: JSON.stringify({ status }),
      }),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: async () => {
      await refresh()
      toast.success('تم تحديث حالة الطلب')
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر تحديث حالة الطلب'),
  })

  const bulkSetStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const results = await Promise.allSettled(
        ids.map((id) =>
          merchantRequest(`/api/orders/merchant/${encodeURIComponent(id)}/status`, {
            method: 'PATCH',
            headers: { 'Idempotency-Key': statusKey(id) },
            body: JSON.stringify({ status }),
          }),
        ),
      )
      const ok = results.filter((r) => r.status === 'fulfilled').length
      return { ok, failed: results.length - ok }
    },
    onSuccess: async ({ ok, failed }) => {
      await refresh()
      // Partial success is the common case here — some orders in a selection
      // are usually in a state the transition isn't valid from.
      if (ok) toast.success(`تم تحديث ${ok} طلب`)
      if (failed) toast.error(`تعذر تحديث ${failed} طلب`)
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر تحديث الطلبات'),
  })

  return { busyId, setStatus, bulkSetStatus }
}

/* ============================================================================
   Columns
   ========================================================================== */

/**
 * The drawer opener and the mutations reach cells through context rather than
 * as arguments to the column factory. react-query returns a new `actions`
 * object on every render, so passing it in would rebuild the column array —
 * and the visibility menu's memo with it — on each one.
 */
const OrderDialogCtx = React.createContext<((o: MerchantOrder) => void) | null>(null)
const ActionsCtx = React.createContext<OrderActions | null>(null)

export function useOrderColumns(): Column<MerchantOrder>[] {
  return React.useMemo<Column<MerchantOrder>[]>(
    () => [
      {
        id: 'orderNumber',
        header: 'رقم الطلب',
        width: '130px',
        hideable: false,
        cell: (o) => <Code>{o.orderNumber || o._id.slice(-6)}</Code>,
      },
      {
        id: 'status',
        header: 'الحالة',
        width: '150px',
        truncate: false,
        cell: (o) => (
          <StatusBadge tone={toneFor(o.status)} label={getOrderStatusMeta(o.status).label} />
        ),
      },
      {
        id: 'customer',
        header: 'العميل',
        cell: (o) =>
          o.customerInfo?.name ? (
            <CellTitle title={o.customerInfo.name} subtitle={o.customerInfo.phone} />
          ) : (
            <CellEmpty />
          ),
      },
      {
        id: 'items',
        header: 'المنتجات',
        width: '200px',
        cell: (o) => <ItemsCell order={o} />,
      },
      {
        id: 'count',
        header: 'القطع',
        width: '70px',
        align: 'end',
        defaultHidden: true,
        cell: (o) => o.productsCount ?? 0,
      },
      {
        id: 'revenue',
        header: 'إيرادك',
        width: '130px',
        align: 'end',
        cell: (o) => (
          <span className="font-medium text-foreground">
            {formatMoney(o.merchantRevenue ?? 0, getOrderCurrency(o as never))}
          </span>
        ),
      },
      {
        id: 'orderDate',
        header: 'التاريخ',
        width: '110px',
        cell: (o) =>
          o.orderDate ? (
            <span className="text-text-muted nums">
              {new Date(o.orderDate).toLocaleDateString('en-CA')}
            </span>
          ) : (
            <CellEmpty />
          ),
      },
      {
        id: 'proof',
        header: 'إثبات التحويل',
        width: '110px',
        defaultHidden: true,
        cell: (o) =>
          o.transferProof ? (
            <a
              href={o.transferProof}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-tone-info-fg hover:underline focus-ring"
            >
              عرض
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <CellEmpty />
          ),
      },
      {
        id: 'actions',
        header: '',
        width: '48px',
        align: 'center',
        hideable: false,
        truncate: false,
        cell: (o) => <RowActions order={o} />,
      },
    ],
    [],
  )
}

function ItemsCell({ order }: { order: MerchantOrder }) {
  const shown = (order.products ?? []).slice(0, 2)
  const remaining = (order.productsCount ?? 0) - shown.length

  if (shown.length === 0) return <CellEmpty />

  return (
    <div className="min-w-0 space-y-0.5">
      {shown.map((line, i) => (
        <div key={i} className="truncate text-[11px] leading-4">
          <span className="text-foreground">{line.product?.name || line.name || 'منتج'}</span>
          <span className="text-text-faint"> × {line.quantity}</span>
        </div>
      ))}
      {remaining > 0 && <div className="text-[11px] text-text-faint">+{remaining} أخرى</div>}
    </div>
  )
}

function RowActions({ order }: { order: MerchantOrder }) {
  const openDetails = React.useContext(OrderDialogCtx)
  const actions = React.useContext(ActionsCtx)
  if (!actions) return null
  const next = nextTransition(order.status)
  const busy = actions.busyId === order._id

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="إجراءات الطلب" loading={busy}>
            {!busy && <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem className="text-[12px]" onSelect={() => openDetails?.(order)}>
            عرض التفاصيل
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] text-text-faint">
            تحديث الحالة
          </DropdownMenuLabel>
          {MERCHANT_TRANSITIONS.map((t) => {
            const Icon = t.icon
            return (
              <DropdownMenuItem
                key={t.value}
                className="text-[12px]"
                // Only the funnel's next step is offered as the obvious move;
                // the rest stay available but are clearly not the default.
                disabled={busy || order.status?.toLowerCase() === t.value}
                onSelect={() => actions.setStatus.mutate({ id: order._id, status: t.value })}
              >
                <Icon className="size-3.5" />
                {t.label}
                {next?.value === t.value && (
                  <span className="ms-auto text-[10px] text-text-faint">التالي</span>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* ============================================================================
   Table
   ========================================================================== */

export function OrdersTable({
  data,
  columns,
  visibleColumns,
  loading,
  selection,
  actions,
  empty,
}: {
  data: MerchantOrder[]
  columns: Column<MerchantOrder>[]
  visibleColumns?: Column<MerchantOrder>[]
  loading?: boolean
  selection: { selected: string[]; onChange: (ids: string[]) => void }
  actions: OrderActions
  empty?: React.ReactNode
}) {
  const [details, setDetails] = React.useState<MerchantOrder | null>(null)
  const open = React.useMemo(() => (o: MerchantOrder) => setDetails(o), [])

  return (
    <ActionsCtx.Provider value={actions}>
      <OrderDialogCtx.Provider value={open}>
        <DataTable
          data={data}
          columns={columns}
          visibleColumns={visibleColumns}
          getRowId={(o) => o._id}
          loading={loading}
          empty={empty}
          selection={selection}
          onRowClick={setDetails}
          rowAccent={(o) =>
            getOrderStatusMeta(o.status).rank === -1 ? 'bg-tone-danger-fg' : undefined
          }
          bulkActions={(ids) =>
            MERCHANT_TRANSITIONS.map((t) => {
              const Icon = t.icon
              return (
                <Button
                  key={t.value}
                  variant="ghost"
                  size="sm"
                  disabled={actions.bulkSetStatus.isPending}
                  onClick={() => {
                    actions.bulkSetStatus.mutate({ ids, status: t.value })
                    selection.onChange([])
                  }}
                >
                  <Icon />
                  {t.label}
                </Button>
              )
            })
          }
        />

        <OrderDetails order={details} actions={actions} onClose={() => setDetails(null)} />
      </OrderDialogCtx.Provider>
    </ActionsCtx.Provider>
  )
}

/* ============================================================================
   Detail drawer
   ========================================================================== */

function OrderDetails({
  order,
  actions,
  onClose,
}: {
  order: MerchantOrder | null
  actions: OrderActions
  onClose: () => void
}) {
  return (
    <Sheet open={Boolean(order)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="left" className="w-full gap-0 p-0 sm:max-w-md">
        {order && <OrderDetailsBody order={order} actions={actions} />}
      </SheetContent>
    </Sheet>
  )
}

function OrderDetailsBody({ order, actions }: { order: MerchantOrder; actions: OrderActions }) {
  const code = getOrderCurrency(order as never)
  const meta = getOrderStatusMeta(order.status)
  const next = nextTransition(order.status)
  const lines = order.products ?? []

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SheetHeader className="shrink-0 gap-1 border-b border-border px-5 py-4">
        <SheetTitle className="flex items-center gap-2 text-[15px]">
          <span>طلب</span>
          <Code>{order.orderNumber || order._id.slice(-6)}</Code>
        </SheetTitle>
        <div className="flex items-center gap-2">
          <StatusBadge tone={toneFor(order.status)} label={meta.label} variant="chip" />
          <span className="text-[12px] text-text-muted nums">
            {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-CA') : '—'}
          </span>
        </div>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto quiet-scroll px-5 py-4">
        <Section title="العميل">
          <dl>
            <DetailRow label="الاسم">{order.customerInfo?.name || '—'}</DetailRow>
            <DetailRow label="الهاتف">
              <span dir="ltr">{order.customerInfo?.phone || '—'}</span>
            </DetailRow>
            <DetailRow label="البريد">{order.customerInfo?.email || '—'}</DetailRow>
          </dl>
        </Section>

        <Section title={`المنتجات (${order.productsCount ?? lines.length})`}>
          {lines.length === 0 ? (
            <p className="py-2 text-[12px] text-text-muted">لا توجد تفاصيل منتجات لهذا الطلب.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map((line, i) => {
                const unit = line.price || line.product?.price || 0
                const attributes = line.attributes ?? {}
                const variant = [
                  ...Object.entries(attributes).map(([k, v]) => `${k}: ${v}`),
                  line.size && !Object.keys(attributes).length ? `مقاس: ${line.size}` : null,
                  line.color ? `لون: ${line.color}` : null,
                ].filter(Boolean)

                return (
                  <li key={i} className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-foreground">
                        {line.product?.name || line.name || 'منتج'}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {line.quantity} × {formatMoney(unit, code)}
                        {variant.length > 0 && ` · ${variant.join('، ')}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] font-medium nums">
                      {formatMoney(unit * (line.quantity ?? 1), code)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}

          <Divider className="my-3" />
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-medium text-foreground">إيرادك من هذا الطلب</span>
            <span className="text-[15px] font-semibold text-tone-success-fg nums">
              {formatMoney(order.merchantRevenue ?? 0, code)}
            </span>
          </div>
        </Section>

        {order.transferProof && (
          <Section title="إثبات التحويل">
            <a
              href={order.transferProof}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] text-tone-info-fg hover:underline focus-ring"
            >
              فتح الإثبات
              <ExternalLink className="size-3.5" />
            </a>
          </Section>
        )}
      </div>

      {next && (
        <div className="shrink-0 border-t border-border bg-background px-5 py-3">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            loading={actions.busyId === order._id}
            onClick={() => actions.setStatus.mutate({ id: order._id, status: next.value })}
          >
            {next.label}
          </Button>
        </div>
      )}
    </div>
  )
}
