"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from '@clerk/nextjs'
import { axiosInstance } from '@/lib/axiosInstance'
import { toast } from 'sonner'
import logger from '@/lib/logger'
import { Checkbox } from "@/components/ui/checkbox"

export type Order = {
  _id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  merchantRevenue: number
  transferProof?: string
  products: any[]
  productsCount: number
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  orderDate: string
  createdAt: string
}

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }
  return statusMap[status] || "bg-gray-100 text-gray-800"
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Status options available for merchants
const merchantStatusOptions = [
  { value: "confirmed", label: "تأكيد" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
]

export const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "orderNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("orderNumber")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className="capitalize">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "customerInfo.name",
    header: "Customer Name",
    cell: ({ row }) => {
      const customer = row.original.customerInfo
      return <div>{customer?.name || 'N/A'}</div>
    },
  },
  {
    accessorKey: "customerInfo.email",
    header: "Customer Email",
    cell: ({ row }) => {
      const customer = row.original.customerInfo
      return <div>{customer?.email || 'N/A'}</div>
    },
  },
  {
    accessorKey: "customerInfo.phone",
    header: "Customer Phone",
    cell: ({ row }) => {
      const customer = row.original.customerInfo
      return <div dir="ltr">{customer?.phone || 'N/A'}</div>
    },
  },
  {
    accessorKey: "productsCount",
    header: "Items",
    cell: ({ row }) => (
      <div>{row.getValue("productsCount")}</div>
    ),
  },
  {
    accessorKey: "merchantRevenue",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Revenue
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const revenue = parseFloat(row.getValue("merchantRevenue"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(revenue)
      return <div className="font-medium text-green-600">{formatted}</div>
    },
  },
  {
    accessorKey: "orderDate",
    header: "Order Date",
    cell: ({ row }) => {
      const date = row.getValue("orderDate") as string
      return <div className="text-sm">{formatDate(date)}</div>
    },
  },
  {
    header: "Payment Proof",
    accessorKey: "transferProof",
    cell: ({ row }) => {
      const transferProof = row.original.transferProof;
      return transferProof ? (
        <div className="flex items-center gap-2">
          <a
            href={transferProof}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm flex items-center gap-1"
          >
            <span>View</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </a>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell order={row.original} />,
  },
]

interface OrdersTableProps {
  orders: Order[]
}

// Bulk Actions Component
const BulkActions = ({ selectedOrders, onActionComplete }: { selectedOrders: Order[], onActionComplete: () => void }) => {
  const { getToken } = useAuth()

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const token = await getToken()
      if (!token) {
        toast.error('فشل المصادقة')
        return
      }

      // Update all selected orders
      const promises = selectedOrders.map(order =>
        axiosInstance.patch(
          `/orders/merchant/${order._id}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      )

      await Promise.all(promises)
      toast.success(`تم تحديث حالة ${selectedOrders.length} طلب بنجاح`)
      onActionComplete()
    } catch (error: any) {
      logger.error('Error updating bulk order status', { error: error instanceof Error ? error.message : String(error) })
      toast.error('فشل تحديث حالة الطلبات')
    }
  }

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            تحديث الحالة
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>تحديث الحالة الجماعي</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {merchantStatusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleBulkStatusUpdate(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Actions Cell Component
const ActionsCell = ({ order }: { order: Order }) => {
  const { getToken } = useAuth()

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = await getToken()
      if (!token) {
        toast.error('فشل المصادقة')
        return
      }

      await axiosInstance.patch(
        `/orders/merchant/${order._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('تم تحديث حالة الطلب بنجاح')
      // Refresh the page to show updated status
      window.location.reload()
    } catch (error: any) {
      logger.error('Error updating order status', { error: error instanceof Error ? error.message : String(error) })
      toast.error('فشل تحديث حالة الطلب')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>تحديث الحالة</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {merchantStatusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            disabled={order.status === option.value}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedRow, setSelectedRow] = React.useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const handleRowClick = (order: Order) => {
    setSelectedRow(order)
    setIsModalOpen(true)
  }

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const selectedOrders = table.getFilteredSelectedRowModel().rows.map(row => row.original)

  return (
    <div className="w-full">
      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-2 py-4 px-4 bg-muted rounded-lg mb-4">
          <span className="text-sm font-medium">
            تم تحديد {selectedOrders.length} طلب
          </span>
          <BulkActions selectedOrders={selectedOrders} onActionComplete={() => {
            table.toggleAllPageRowsSelected(false)
            window.location.reload()
          }} />
        </div>
      )}

      <div className="flex items-center py-4">
        <Input
          placeholder="Search by order number..."
          value={(table.getColumn("orderNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("orderNumber")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick(row.original)}
                  className="cursor-pointer hover:bg-muted"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} order(s)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <OrderDetailsDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedRow}
      />
    </div>
  )
}

interface OrderDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

function OrderDetailsDialog({ isOpen, onClose, order }: OrderDetailsDialogProps) {
  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل الطلب #{order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">معلومات العميل</h3>
            <div className="space-y-2">
              <p><span className="font-medium">الاسم:</span> {order.customerInfo?.name || 'غير محدد'}</p>
              <p><span className="font-medium">البريد الإلكتروني:</span> {order.customerInfo?.email || 'غير محدد'}</p>
              <p><span className="font-medium">الهاتف:</span> <span dir="ltr">{order.customerInfo?.phone || 'غير محدد'}</span></p>
            </div>
          </div>

          {/* Order Information */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">معلومات الطلب</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">رقم الطلب:</span> {order.orderNumber}</p>
                <p><span className="font-medium">الحالة:</span> <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{order.status}</span></p>
              </div>
              <div>
                <p><span className="font-medium">تاريخ الطلب:</span> {formatDate(order.orderDate)}</p>
                <p><span className="font-medium">عدد المنتجات:</span> {order.productsCount}</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">المنتجات</h3>
            <div className="space-y-3">
              {order.products?.map((product, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{product.name || 'منتج غير محدد'}</p>
                    <p className="text-sm text-gray-600">الكمية: {product.quantity}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">${product.price?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">إيراد التاجر:</span>
                <span className="font-bold text-green-600">
                  ${order.merchantRevenue?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Proof */}
          {order.transferProof && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">إثبات التحويل</h3>
              <a
                href={order.transferProof}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                <span>عرض إثبات التحويل</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </a>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
