"use client";

import * as React from "react";
import OrderDialog from "./orderDialog";
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
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import type { Order, OrderStatus, PaymentStatus } from "./types";
import { getStatusInArabic, getPaymentStatusInArabic, getPaymentMethodArabic, formatDate, formatMoney, getOrderTotal, getItemsCount, getCustomerName, getCustomerEmail, getCustomerPhone, getAddressText, getMerchantNames } from "./types";
import { useAuth } from "@clerk/nextjs";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import logger from "@/lib/logger";

// ─────────────────────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────────────────────

// Columns will be defined inside the component to access handlers
const createColumns = (handleProductClick: (product: any) => void): ColumnDef<Order>[] => [
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
    header: "رقم الطلب",
    cell: ({ row }) => <div className="font-medium">{row.original.orderNumber || row.original._id}</div>,
  },

  {
    accessorKey: "status",
    header: "حالة الطلب",
    cell: ({ row }) => {
      const status = String(row.original.status || "");
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === "DELIVERED" || status === "delivered"
              ? "bg-green-100 text-green-800"
              : status === "SHIPPED" || status === "shipped"
              ? "bg-blue-100 text-blue-800"
              : status === "CONFIRMED" || status === "confirmed"
              ? "bg-yellow-100 text-yellow-800"
              : status === "CANCELLED" || status === "cancelled"
              ? "bg-red-100 text-red-800"
              : status === "AWAITING_PAYMENT_CONFIRMATION"
              ? "bg-purple-100 text-purple-800"
              : status === "PAYMENT_FAILED"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {getStatusInArabic(status)}
        </span>
      );
    },
  },

  {
    id: "paymentMethod",
    header: "الدفع",
    accessorFn: (row) => row.paymentMethod || "—",
    cell: ({ row }) => (
      <span className="text-sm font-semibold">{getPaymentMethodArabic(row.original.paymentMethod)}</span>
    ),
  },

  {
    id: "paymentStatus",
    header: "حالة الدفع",
    accessorFn: (row) => row.paymentStatus || "—",
    cell: ({ row }) => {
      const s = String(row.original.paymentStatus || "");
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            s === "PAID" || s === "paid"
              ? "bg-green-100 text-green-800"
              : s === "REJECTED"
              ? "bg-red-100 text-red-800"
              : s === "PENDING_CONFIRMATION"
              ? "bg-yellow-100 text-yellow-800"
              : s === "FAILED" || s === "failed"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {getPaymentStatusInArabic(s)}
        </span>
      );
    },
  },

  {
    id: "customerName",
    header: "اسم العميل",
    accessorFn: (row) => getCustomerName(row),
    cell: ({ row }) => <div className="capitalize">{getCustomerName(row.original)}</div>,
  },

  {
    id: "customerEmail",
    header: "البريد الإلكتروني",
    accessorFn: (row) => getCustomerEmail(row),
    cell: ({ row }) => <div>{getCustomerEmail(row.original)}</div>,
  },

  {
    id: "customerPhone",
    header: "الهاتف",
    accessorFn: (row) => getCustomerPhone(row),
    cell: ({ row }) => <div dir="ltr">{getCustomerPhone(row.original)}</div>,
  },

  {
    id: "merchants",
    header: "التاجر",
    accessorFn: (row) => getMerchantNames(row),
    cell: ({ row }) => <div className="max-w-[200px] truncate" title={getMerchantNames(row.original)}>{getMerchantNames(row.original)}</div>,
  },

  {
    id: "address",
    header: "العنوان",
    accessorFn: (row) => getAddressText(row),
    cell: ({ row }) => {
      const txt = getAddressText(row.original);
      return (
        <div className="max-w-[240px] truncate" title={txt}>
          {txt}
        </div>
      );
    },
  },

  {
    header: "صورة التحويل",
    accessorKey: "transferProof",
    cell: ({ row }) => {
      const url = row.original.transferProof;
      return url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
          عرض
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },

  {
    id: "itemsCount",
    header: "عدد المنتجات",
    accessorFn: (row) => getItemsCount(row),
    cell: ({ row }) => <div className="text-green-600 font-semibold">{getItemsCount(row.original)}</div>,
  },

  {
    id: "productsPreview",
    header: "المنتجات",
    cell: ({ row }) => {
      const order = row.original;
      // Get products from different possible sources
      const products = Array.isArray(order.items) ? order.items :
                      Array.isArray(order.productsDetails) ? order.productsDetails :
                      Array.isArray(order.products) ? order.products : [];

      const displayProducts = products.slice(0, 2); // Show first 2 products
      const remaining = products.length - displayProducts.length;

      return (
        <div className="max-w-[200px]">
          <div className="space-y-1">
            {displayProducts.map((product, idx) => (
              <div key={idx} className="text-xs mb-1">
                <div
                  className="truncate cursor-pointer text-blue-600 hover:text-blue-800"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click
                    handleProductClick(product);
                  }}
                >
                  {product.name || product.product?.name || 'منتج غير معروف'} × {product.quantity}
                </div>
                {/* Show attributes inline */}
                {product.attributes && typeof product.attributes === 'object' && (
                  <div className="text-gray-500 truncate text-xs">
                    {Object.entries(product.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </div>
                )}
                {product.size && (
                  <div className="text-gray-500 text-xs">
                    مقاس: {product.size}
                  </div>
                )}
              </div>
            ))}
            {remaining > 0 && (
              <div className="text-xs text-muted-foreground">
                +{remaining} أكثر...
              </div>
            )}
          </div>
        </div>
      );
    },
  },

  {
    id: "total",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-right justify-end"
      >
        الإجمالي
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    accessorFn: (row) => getOrderTotal(row),
    cell: ({ row }) => <div className="font-medium">{formatMoney(getOrderTotal(row.original), row.original.currency || "SDG")}</div>,
  },

  {
    id: "createdAt",
    header: "تاريخ الطلب",
    accessorFn: (row) => row.createdAt || row.orderDate,
    cell: ({ row }) => <div className="text-sm">{formatDate(row.original.createdAt || row.original.orderDate)}</div>,
  },

  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const order = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <span className="sr-only">فتح القائمة</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>العمليات</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order._id)}>نسخ معرف الطلب</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export const columns = createColumns(() => {}); // Default empty handler

// ─────────────────────────────────────────────────────────────
// Bulk Actions Component
// ─────────────────────────────────────────────────────────────

const BulkActions = ({ selectedOrders, onActionComplete }: { selectedOrders: Order[], onActionComplete: () => void }) => {
  const { getToken } = useAuth();

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error('فشل المصادقة');
        return;
      }

      // Update all selected orders
      const promises = selectedOrders.map(order =>
        axiosInstance.patch(
          `/orders/${order._id}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      await Promise.all(promises);
      toast.success(`تم تحديث حالة ${selectedOrders.length} طلب بنجاح`);
      onActionComplete();
    } catch (error: any) {
      logger.error('Error updating bulk order status', { error: error instanceof Error ? error.message : String(error) });
      toast.error('فشل تحديث حالة الطلبات');
    }
  };

  const adminStatusOptions = [
    { value: "PENDING", label: "قيد الانتظار" },
    { value: "AWAITING_PAYMENT_CONFIRMATION", label: "انتظار تأكيد الدفع" },
    { value: "CONFIRMED", label: "مؤكد" },
    { value: "PROCESSING", label: "قيد المعالجة" },
    { value: "SHIPPED", label: "تم الشحن" },
    { value: "DELIVERED", label: "تم التسليم" },
    { value: "CANCELLED", label: "ملغي" },
    { value: "PAYMENT_FAILED", label: "فشل الدفع" },
  ];

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
          {adminStatusOptions.map((option) => (
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
  );
};

// ─────────────────────────────────────────────────────────────
// Table Component
// ─────────────────────────────────────────────────────────────

export function DataTable({ orders }: { orders: Order[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedRow, setSelectedRow] = React.useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  const [isProductModalOpen, setIsProductModalOpen] = React.useState(false);

  const handleRowClick = (order: Order) => {
    setSelectedRow(order);
    setIsModalOpen(true);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const table = useReactTable({
    data: orders,
    columns: createColumns(handleProductClick),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const selectedOrders = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  return (
    <div className="w-full">
      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-2 py-4 px-4 bg-muted rounded-lg mb-4">
          <span className="text-sm font-medium">
            تم تحديد {selectedOrders.length} طلب
          </span>
          <BulkActions selectedOrders={selectedOrders} onActionComplete={() => {
            table.toggleAllPageRowsSelected(false);
            // Refresh the page to show updated data
            window.location.reload();
          }} />
        </div>
      )}

      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="البحث برقم الطلب..."
          value={(table.getColumn("orderNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("orderNumber")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              اخفاء/اظهار <ChevronDown className="mr-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick(row.original)}
                  className="cursor-pointer hover:bg-muted"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  لا توجد نتائج.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} من {table.getFilteredRowModel().rows.length} صف محدد.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            السابق
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            التالي
          </Button>
        </div>
      </div>

      <OrderDialog isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} selectedRow={selectedRow} />

      <ProductDetailsModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}

function ProductDetailsModal({ isOpen, onClose, product }: { isOpen: boolean; onClose: () => void; product: any }) {
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
                  <p className="font-medium">${(productData.price || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">الكمية المطلوبة</p>
                  <p className="font-medium">{product.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">السعر الكلي</p>
                  <p className="font-medium">${((product.price || productData.price || 0) * product.quantity).toFixed(2)}</p>
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
                    {product.attributes && typeof product.attributes === 'object' && (
                      Object.entries(product.attributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="capitalize">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))
                    )}
                    {product.size && (
                      <div className="flex justify-between text-sm">
                        <span>المقاس:</span>
                        <span className="font-medium">{product.size}</span>
                      </div>
                    )}
                    {product.variantId && (
                      <div className="flex justify-between text-sm">
                        <span>معرف المتغير:</span>
                        <span className="font-medium">{product.variantId}</span>
                      </div>
                    )}
                    {productData.variantId && !product.variantId && (
                      <div className="flex justify-between text-sm">
                        <span>معرف المتغير:</span>
                        <span className="font-medium">{productData.variantId}</span>
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
                        <span className="font-medium">${product.merchantPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {product.nubianMarkup && (
                      <div className="flex justify-between text-sm">
                        <span>هامش Nubian:</span>
                        <span className="font-medium">${product.nubianMarkup.toFixed(2)}</span>
                      </div>
                    )}
                    {product.dynamicMarkup && (
                      <div className="flex justify-between text-sm">
                        <span>هامش ديناميكي:</span>
                        <span className="font-medium">${product.dynamicMarkup.toFixed(2)}</span>
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
  );
}

export default function App() {
  return null;
}
