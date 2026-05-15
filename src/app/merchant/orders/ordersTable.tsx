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
import { toast } from 'sonner'
import logger from '@/lib/logger'
import { Checkbox } from "@/components/ui/checkbox"
import { formatMoney, getOrderCurrency } from "@/app/admin/orders/types"

// Per-attempt idempotency key for merchant-scoped status mutations.
function newMerchantStatusKey(orderId: string) {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `merchant-status:${orderId}:${uuid}`
}

async function patchMerchantOrderStatus(orderId: string, status: string) {
  const res = await fetch(`/api/orders/merchant/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': newMerchantStatusKey(orderId),
    },
    body: JSON.stringify({ status }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as any)?.message || `Request failed with status ${res.status}`)
  }
  return data
}



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
  // multi-currency fields propagated from the backend snapshot
  currency?: string
  currencyCodeSelected?: string
  finalAmountConverted?: number
  totalAmountConverted?: number
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

// Columns will be defined inside the component to access handlers
const createColumns = (
  handleProductClick: (product: any) => void,
  onRefresh?: () => void
): ColumnDef<Order>[] => [
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
    id: "productsPreview",
    header: "Products",
    cell: ({ row }) => {
      const order = row.original;
      const products = order.products?.slice(0, 2) || []; // Show first 2 products
      const remaining = (order.productsCount || 0) - products.length;

      return (
        <div className="max-w-[200px]">
          <div className="space-y-1">
            {products.map((product, idx) => (
              <div key={idx} className="text-xs mb-1">
                <div
                  className="truncate cursor-pointer text-blue-600 hover:text-blue-800"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click
                    handleProductClick(product);
                  }}
                >
                  {product.product?.name || product.name || 'Unknown Product'} × {product.quantity}
                </div>
                {/* Show attributes inline */}
                {product.attributes && typeof product.attributes === 'object' && Object.keys(product.attributes).length > 0 && (
                  <div className="text-gray-500 truncate text-xs">
                    {Object.entries(product.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </div>
                )}
                {(!product.attributes || Object.keys(product.attributes || {}).length === 0) && product.size && (
                  <div className="text-gray-500 text-xs">
                    مقاس: {product.size}
                  </div>
                )}
                {product.color && (
                  <div className="text-gray-500 text-xs">
                    لون: {product.color}
                  </div>
                )}
              </div>
            ))}
            {remaining > 0 && (
              <div className="text-xs text-muted-foreground">
                +{remaining} more...
              </div>
            )}
          </div>
        </div>
      );
    },
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
      const revenue = parseFloat(row.getValue("merchantRevenue") as string)
      // merchantRevenue is stored in USD base by the backend — render with
      // the same currency context the order was placed in so the table is
      // visually consistent with the total column.
      const code = getOrderCurrency(row.original as any)
      return <div className="font-medium text-green-600">{formatMoney(revenue, code)}</div>
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
    cell: ({ row }) => <ActionsCell order={row.original} onRefresh={onRefresh} />,
  },
]

export const columns = createColumns(() => {}) // Default empty handler

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
}

// Bulk Actions Component
const BulkActions = ({ selectedOrders, onActionComplete }: { selectedOrders: Order[], onActionComplete: () => void }) => {
  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      // Update all selected orders — patchMerchantOrderStatus creates its own
      // idempotency key per order so a duplicate click can't double-apply.
      const promises = selectedOrders.map((order) =>
        patchMerchantOrderStatus(order._id, newStatus)
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
const ActionsCell = ({ order, onRefresh }: { order: Order; onRefresh?: () => void }) => {
  const handleStatusChange = async (newStatus: string) => {
    try {
      await patchMerchantOrderStatus(order._id, newStatus)
      toast.success('تم تحديث حالة الطلب بنجاح')
      onRefresh?.()
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

export function OrdersTable({ orders, onRefresh, pagination, onPageChange }: OrdersTableProps) {
  const useServerPagination = !!pagination && !!onPageChange;
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedRow, setSelectedRow] = React.useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null)
  const [isProductModalOpen, setIsProductModalOpen] = React.useState(false)

  const handleRowClick = (order: Order) => {
    setSelectedRow(order)
    setIsModalOpen(true)
  }

  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const table = useReactTable({
    data: orders,
    columns: createColumns(handleProductClick, onRefresh),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    ...(useServerPagination
      ? { manualPagination: true, pageCount: pagination!.totalPages }
      : { getPaginationRowModel: getPaginationRowModel() }),
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
            onRefresh?.()
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
                  role="button"
                  tabIndex={0}
                  aria-label={`عرض الطلب ${row.original.orderNumber || row.original._id}`}
                  onClick={() => handleRowClick(row.original)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(row.original);
                    }
                  }}
                  className="cursor-pointer hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          {useServerPagination
            ? `صفحة ${pagination!.page} من ${pagination!.totalPages || 1} • ${pagination!.total.toLocaleString()} طلب`
            : `${table.getFilteredRowModel().rows.length} order(s)`}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (useServerPagination) onPageChange!(Math.max(1, pagination!.page - 1))
              else table.previousPage()
            }}
            disabled={useServerPagination ? pagination!.page <= 1 : !table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (useServerPagination) onPageChange!(pagination!.page + 1)
              else table.nextPage()
            }}
            disabled={
              useServerPagination
                ? pagination!.page >= pagination!.totalPages
                : !table.getCanNextPage()
            }
          >
            Next
          </Button>
        </div>
      </div>

      <OrderDetailsDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedRow}
        onProductClick={handleProductClick}
      />

      <ProductDetailsModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  )
}

function ProductDetailsModal({ isOpen, onClose, product }: ProductDetailsModalProps) {
  if (!product) return null

  const productData = product.product || product

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل المنتج</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Images */}
          {productData.images && productData.images.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">صور المنتج</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {productData.images.map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${productData.name} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Product Information */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">معلومات المنتج</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">اسم المنتج</p>
                  <p className="font-medium">{productData.name || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">السعر</p>
                  <p className="font-medium">{formatMoney(productData.price || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">الكمية المطلوبة</p>
                  <p className="font-medium">{product.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">السعر الكلي</p>
                  <p className="font-medium">{formatMoney((product.price || productData.price || 0) * product.quantity)}</p>
                </div>
              </div>

              {productData.description && (
                <div>
                  <p className="text-sm text-gray-600">الوصف</p>
                  <p className="text-sm">{productData.description}</p>
                </div>
              )}

              {productData.category && (
                <div>
                  <p className="text-sm text-gray-600">الفئة</p>
                  <p className="text-sm">{productData.category}</p>
                </div>
              )}

              {productData.stock !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">المخزون</p>
                  <p className="text-sm">{productData.stock}</p>
                </div>
              )}

              {/* Product Attributes/Variants */}
              {(product.attributes || product.size || product.variantId || productData.variantId) && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">الخصائص والمتغيرات</p>
                  <div className="space-y-1">
                    {product.attributes && typeof product.attributes === 'object' && Object.keys(product.attributes).length > 0 && (
                      Object.entries(product.attributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="capitalize">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))
                    )}
                    {(!product.attributes || Object.keys(product.attributes || {}).length === 0) && product.size && (
                      <div className="flex justify-between text-sm">
                        <span>المقاس:</span>
                        <span className="font-medium">{product.size}</span>
                      </div>
                    )}
                    {(product.variantId || productData.variantId) && (
                      <div className="flex justify-between text-sm">
                        <span>معرف المتغير:</span>
                        <span className="font-medium">{product.variantId || productData.variantId}</span>
                      </div>
                    )}
                    {/* Show any additional attributes that might be stored differently */}
                    {product.color && (
                      <div className="flex justify-between text-sm">
                        <span>اللون:</span>
                        <span className="font-medium">{product.color}</span>
                      </div>
                    )}
                    {product.style && (
                      <div className="flex justify-between text-sm">
                        <span>النمط:</span>
                        <span className="font-medium">{product.style}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Pricing Info */}
              {(product.merchantPrice || product.nubianMarkup || product.dynamicMarkup) && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">تفاصيل التسعير</p>
                  <div className="space-y-1">
                    {product.merchantPrice && (
                      <div className="flex justify-between text-sm">
                        <span>سعر التاجر:</span>
                        <span className="font-medium">{formatMoney(product.merchantPrice)}</span>
                      </div>
                    )}
                    {product.nubianMarkup && (
                      <div className="flex justify-between text-sm">
                        <span>هامش Nubian:</span>
                        <span className="font-medium">{formatMoney(product.nubianMarkup)}</span>
                      </div>
                    )}
                    {product.dynamicMarkup && (
                      <div className="flex justify-between text-sm">
                        <span>هامش ديناميكي:</span>
                        <span className="font-medium">{formatMoney(product.dynamicMarkup)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface OrderDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  onProductClick?: (product: any) => void
}

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
}

function OrderDetailsDialog({ isOpen, onClose, order, onProductClick }: OrderDetailsDialogProps) {
  if (!order) return null
  const code = getOrderCurrency(order as any)

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
            {(order.products && order.products.length > 0) ? (
              <div className="space-y-3">
                {order.products.map((product, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b pb-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => onProductClick?.(product)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-blue-600 hover:text-blue-800">{product.product?.name || product.name || 'منتج غير محدد'}</p>
                      <p className="text-sm text-gray-600">الكمية: {product.quantity}</p>
                      {/* Show attributes if available */}
                      {product.attributes && typeof product.attributes === 'object' && Object.keys(product.attributes).length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {Object.entries(product.attributes).map(([key, value]) => (
                            <span key={key} className="inline-block mr-2">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                      {(!product.attributes || Object.keys(product.attributes || {}).length === 0) && product.size && (
                        <div className="text-xs text-gray-500 mt-1">
                          مقاس: {product.size}
                        </div>
                      )}
                      {product.color && (
                        <div className="text-xs text-gray-500 mt-1">
                          لون: {product.color}
                        </div>
                      )}
                      {product.product?.images?.[0] && (
                        <img
                          src={product.product.images[0]}
                          alt={product.product.name || 'Product'}
                          className="w-12 h-12 object-cover rounded mt-1"
                        />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{formatMoney(product.price || product.product?.price || 0, code)}</p>
                      <p className="text-sm text-gray-500">الإجمالي: {formatMoney((product.price || product.product?.price || 0) * product.quantity, code)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-500 text-sm">لا توجد منتجات لهذا الطلب</p>
                <p className="text-xs text-gray-400">Products array: {JSON.stringify(order.products)}</p>
                <p className="text-xs text-gray-400">Products count: {order.productsCount}</p>
              </div>
            )}
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">إيراد التاجر:</span>
                <span className="font-bold text-green-600">
                  {formatMoney(order.merchantRevenue || 0, code)}
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
