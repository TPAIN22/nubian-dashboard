'use client'

import * as React from 'react'
import { ChevronDown, Copy, Eye, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import {
  CellEmpty,
  CellTitle,
  Code,
  DataTable,
  EmptyState,
  Pagination,
  SearchInput,
  Toolbar,
  ToolbarDivider,
  ToolbarSpacer,
  useColumnVisibility,
  type Column,
  type SortDir,
} from '@/components/admin'
import { Button } from '@/components/admin/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import logger from '@/lib/logger'

import { OrderStatusBadge, PaymentStatusBadge } from './orderBadges'
import { OrderDetailsDrawer } from './orderDetailsDrawer'
import { OrderItemsCell } from './orderItemsCell'
import { updateOrderStatus, type AdminOrderStatus } from './orderControler'
import { getOrderStatusMeta, getPaymentMethodLabel } from './orderStatus'
import {
  formatDate,
  formatMoney,
  getAddressText,
  getCustomerEmail,
  getCustomerName,
  getCustomerPhone,
  getItemsCount,
  getMerchantNames,
  getOrderCurrency,
  getOrderLines,
  getOrderTotal,
  type Order,
} from './types'

/* ============================================================================
   Orders table
   ----------------------------------------------------------------------------
   Rebuilt on the design system's DataTable. Everything that talks to the
   backend is untouched — `updateOrderStatus`, the idempotency keys, the
   `allSettled` bulk semantics and the drawer all behave exactly as before.

   What changed is the surface:
     · 32px rows instead of 56px — roughly twice the orders visible at once.
     · Sorting, search and column visibility on one 40px toolbar.
     · Selection promotes a floating bulk bar instead of pushing the table down.
     · No separate mobile card list: the table scrolls horizontally and the
       low-value columns are hidden by default, which is what the card list was
       simulating anyway.
   ========================================================================== */

const DEFAULT_HIDDEN = new Set([
  'customerEmail',
  'paymentMethod',
  'merchants',
  'address',
  'transferProof',
  'itemsCount',
])

const adminStatusOptions: { value: AdminOrderStatus; label: string }[] = [
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'AWAITING_PAYMENT_CONFIRMATION', label: 'انتظار تأكيد الدفع' },
  { value: 'CONFIRMED', label: 'مؤكد' },
  { value: 'PROCESSING', label: 'قيد المعالجة' },
  { value: 'SHIPPED', label: 'تم الشحن' },
  { value: 'DELIVERED', label: 'تم التسليم' },
  { value: 'CANCELLED', label: 'ملغي' },
  { value: 'PAYMENT_FAILED', label: 'فشل الدفع' },
]

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface OrdersTableProps {
  orders: Order[]
  onRefresh?: () => void
  pagination?: PaginationMeta
  onPageChange?: (page: number) => void
  isLoading?: boolean
  isRefreshing?: boolean
}

export function OrdersTable({
  orders,
  onRefresh,
  pagination,
  onPageChange,
  isLoading,
  isRefreshing,
}: OrdersTableProps) {
  const [search, setSearch] = React.useState('')
  const [selected, setSelected] = React.useState<string[]>([])
  const [sort, setSort] = React.useState<{ id: string; dir: SortDir } | null>(null)
  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const openOrder = React.useCallback((order: Order) => {
    setActiveOrder(order)
    setDrawerOpen(true)
  }, [])

  /* -- search (client-side, current page only) --------------------------- */
  // `/orders/admin` takes no search parameter, so this cannot reach beyond the
  // rows already loaded. The placeholder says so rather than implying otherwise.
  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return orders
    return orders.filter((o) =>
      [o.orderNumber, o._id, getCustomerName(o), getCustomerEmail(o), getCustomerPhone(o)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [orders, search])

  /* -- sort (client-side, current page only) ----------------------------- */
  const rows = React.useMemo(() => {
    if (!sort) return filtered
    const dir = sort.dir === 'asc' ? 1 : -1
    const value = (o: Order) => {
      switch (sort.id) {
        case 'total':
          return getOrderTotal(o)
        case 'createdAt':
          return new Date(o.createdAt || o.orderDate || 0).getTime()
        case 'itemsCount':
          return getItemsCount(o)
        default:
          return 0
      }
    }
    return [...filtered].sort((a, b) => (value(a) - value(b)) * dir)
  }, [filtered, sort])

  // Selections must not survive a page change — the ids would no longer be on
  // screen and a bulk action would silently hit invisible orders.
  React.useEffect(() => setSelected([]), [pagination?.page, orders])

  const selectedOrders = React.useMemo(
    () => orders.filter((o) => selected.includes(o._id)),
    [orders, selected],
  )

  const columns = React.useMemo<Column<Order>[]>(
    () => [
      {
        id: 'orderNumber',
        header: 'رقم الطلب',
        width: '132px',
        cell: (o) => <Code>{o.orderNumber || o._id.slice(-8)}</Code>,
      },
      {
        id: 'customer',
        header: 'العميل',
        width: '190px',
        cell: (o) => (
          <CellTitle title={getCustomerName(o)} subtitle={<span dir="ltr">{getCustomerPhone(o)}</span>} />
        ),
      },
      {
        id: 'items',
        header: 'المنتجات',
        width: '160px',
        truncate: false,
        cell: (o) => <OrderItemsCell lines={getOrderLines(o)} />,
      },
      {
        id: 'status',
        header: 'حالة الطلب',
        width: '150px',
        cell: (o) => <OrderStatusBadge status={o.status} />,
      },
      {
        id: 'paymentStatus',
        header: 'حالة الدفع',
        width: '150px',
        cell: (o) => <PaymentStatusBadge status={o.paymentStatus} />,
      },
      {
        id: 'total',
        header: 'الإجمالي',
        width: '110px',
        align: 'end',
        sortable: true,
        cell: (o) => (
          <span className="font-medium">{formatMoney(getOrderTotal(o), getOrderCurrency(o))}</span>
        ),
      },
      {
        id: 'createdAt',
        header: 'التاريخ',
        width: '110px',
        sortable: true,
        cell: (o) => (
          <span className="whitespace-nowrap text-text-muted">
            {formatDate(o.createdAt || o.orderDate)}
          </span>
        ),
      },

      /* -- hidden by default, available from the column menu -------------- */
      {
        id: 'customerEmail',
        header: 'البريد الإلكتروني',
        width: '200px',
        defaultHidden: true,
        cell: (o) => <span dir="ltr">{getCustomerEmail(o)}</span>,
      },
      {
        id: 'paymentMethod',
        header: 'طريقة الدفع',
        width: '110px',
        defaultHidden: true,
        cell: (o) => getPaymentMethodLabel(o.paymentMethod),
      },
      {
        id: 'merchants',
        header: 'التاجر',
        width: '170px',
        defaultHidden: true,
        cell: (o) => <span title={getMerchantNames(o)}>{getMerchantNames(o)}</span>,
      },
      {
        id: 'address',
        header: 'العنوان',
        width: '220px',
        defaultHidden: true,
        cell: (o) => <span title={getAddressText(o)}>{getAddressText(o)}</span>,
      },
      {
        id: 'itemsCount',
        header: 'عدد القطع',
        width: '90px',
        align: 'end',
        sortable: true,
        defaultHidden: true,
        cell: (o) => getItemsCount(o),
      },
      {
        id: 'transferProof',
        header: 'صورة التحويل',
        width: '110px',
        defaultHidden: true,
        cell: (o) =>
          o.transferProof ? (
            <a
              href={o.transferProof}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-foreground underline underline-offset-2"
            >
              عرض
            </a>
          ) : (
            <CellEmpty />
          ),
      },

      {
        id: 'actions',
        header: '',
        width: '44px',
        hideable: false,
        truncate: false,
        align: 'center',
        cell: (o) => <RowActions order={o} onOpen={openOrder} />,
      },
    ],
    [openOrder],
  )

  const { visible, menu } = useColumnVisibility(columns, 'admin-orders')

  return (
    <>
      <Toolbar>
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="بحث في هذه الصفحة — رقم الطلب، الاسم، الهاتف"
          className="w-full max-w-xs"
        />
        <ToolbarSpacer />
        {isRefreshing && <span className="text-[11px] text-text-faint">جارٍ التحديث…</span>}
        <ToolbarDivider />
        {menu}
      </Toolbar>

      <DataTable
        data={rows}
        columns={columns}
        visibleColumns={visible}
        getRowId={(o) => o._id}
        loading={isLoading}
        sort={sort}
        onSortChange={setSort}
        onRowClick={openOrder}
        selection={{ selected, onChange: setSelected }}
        rowAccent={(o) => (getOrderStatusMeta(o.status).rank === -1 ? 'bg-tone-danger-fg' : undefined)}
        bulkActions={() => (
          <BulkStatusMenu
            selectedOrders={selectedOrders}
            onDone={() => {
              setSelected([])
              onRefresh?.()
            }}
          />
        )}
        empty={
          <EmptyState
            title={search ? 'لا نتائج مطابقة' : 'لا توجد طلبات'}
            description={
              search
                ? 'جرّب مصطلحاً آخر — البحث يشمل هذه الصفحة فقط.'
                : 'ستظهر الطلبات هنا فور استلام أول طلب بهذه الحالة.'
            }
            action={
              search ? (
                <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                  مسح البحث
                </Button>
              ) : undefined
            }
          />
        }
      />

      {pagination && onPageChange && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onPageChange={onPageChange}
        />
      )}

      <OrderDetailsDrawer
        order={activeOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onChanged={onRefresh}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Row actions                                                                */
/* -------------------------------------------------------------------------- */

function RowActions({ order, onOpen }: { order: Order; onOpen: (o: Order) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={`عمليات الطلب ${order.orderNumber || order._id}`}
          className="grid size-6 place-items-center rounded-[5px] text-text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-canvas-hover hover:text-foreground focus-visible:opacity-100 focus-ring"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-[11px] text-text-faint">العمليات</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[12px]" onClick={() => onOpen(order)}>
          <Eye className="size-3.5" />
          عرض التفاصيل
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[12px]"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(order._id)
              toast.success('تم نسخ معرف الطلب')
            } catch {
              toast.error('تعذّر النسخ إلى الحافظة')
            }
          }}
        >
          <Copy className="size-3.5" />
          نسخ معرف الطلب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------- */
/* Bulk status update                                                         */
/* -------------------------------------------------------------------------- */

function BulkStatusMenu({
  selectedOrders,
  onDone,
}: {
  selectedOrders: Order[]
  onDone: () => void
}) {
  const [busy, setBusy] = React.useState(false)

  const apply = async (newStatus: AdminOrderStatus) => {
    setBusy(true)
    try {
      // One idempotency key per order (the helper mints them), so a duplicate
      // click cannot double-apply. `allSettled` so one rejection doesn't hide
      // the outcome of the rest.
      const results = await Promise.allSettled(
        selectedOrders.map((order) => updateOrderStatus(order._id, newStatus)),
      )
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed === 0) {
        toast.success(`تم تحديث حالة ${selectedOrders.length} طلب بنجاح`)
      } else {
        toast.warning(`تم تحديث ${selectedOrders.length - failed} طلب، وفشل ${failed}`)
      }
      onDone()
    } catch (error) {
      logger.error('Error updating bulk order status', {
        error: error instanceof Error ? error.message : String(error),
      })
      toast.error('فشل تحديث حالة الطلبات')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" loading={busy}>
          تحديث الحالة
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top">
        <DropdownMenuLabel className="text-[11px] text-text-faint">
          تطبيق على {selectedOrders.length} طلب
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {adminStatusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="text-[12px]"
            onClick={() => apply(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
