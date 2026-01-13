
"use client";
import OrderDialog from "./orderDialog";

import * as React from "react";
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

// Product interfaces for type safety
export interface ProductDetail {
  name: string;
  quantity: number;
  price: number;
}

export interface Product {
  product?: {
    name: string;
    price: number;
  };
  quantity: number;
}

// Updated Order type to match API data
export type Order = {
  _id: string;
  user: {
    _id: string;
    // إضافة fullName و emailAddress إذا كانت موجودة في موديل User في الـ Backend وتُعاد مع الـ populate
    fullName?: string; // أضف هذا إذا كان موديل المستخدم يستخدم fullName
    emailAddress?: string; // أضف هذا إذا كان موديل المستخدم يستخدم emailAddress
  };
  products: Product[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  phoneNumber: string;
  address: string;
  city: string;
  paymentMethod: "cash" | "card";
  paymentStatus: "pending" | "paid" | "failed";
  orderNumber: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  productsCount: number;
  customerInfo: {
    name: string; // هذا هو ما يتم إرجاعه من الـ Backend
    email: string; // وهذا ما يتم إرجاعه من الـ Backend
    phone: string;
  };
  productsDetails: ProductDetail[];
  discountAmount?: number;
  finalAmount?: number;
  couponDetails?: {
    code: string;
    discountAmount?: number;
  };
  transferProof?: string;
};

// Helper function to get status in Arabic
export const getStatusInArabic = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "بانتظار التاكيد",
    confirmed: "مؤكد",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
  };
  return statusMap[status] || status;
};

// Helper function to get payment status in Arabic
export const getPaymentStatusInArabic = (paymentStatus: string) => {
  const statusMap: Record<string, string> = {
    pending: "دفع عند الاستلام",
    paid: "مدفوع",
    failed: "فشل",
  };
  return statusMap[paymentStatus] || paymentStatus;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Updated columns to match API data structure
export const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "orderNumber",
    header: "رقم الطلب",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("orderNumber")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "حالة التوصيل",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="capitalize">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === "delivered"
                ? "bg-green-100 text-green-800"
                : status === "shipped"
                ? "bg-blue-100 text-blue-800"
                : status === "confirmed"
                ? "bg-yellow-100 text-yellow-800"
                : status === "cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {getStatusInArabic(status)}
          </span>
        </div>
      );
    },
  },
  {
    id: "customerName",
    accessorFn: (row) => row.customerInfo?.name || "غير محدد",
    header: "اسم العميل",
    cell: ({ row }) => {
      const order = row.original;
      const customerName = order.customerInfo?.name || "غير محدد";
      return <div className="capitalize">{customerName}</div>;
    },
  },
  // **إضافة هذا العمود الجديد للبريد الإلكتروني للعميل**
  {
    id: "customerEmail", // معرف فريد للعمود
    accessorFn: (row) => row.customerInfo?.email || "غير محدد", // الوصول إلى حقل email داخل customerInfo
    header: "البريد الإلكتروني", // عنوان العمود
    cell: ({ row }) => {
      const order = row.original;
      const customerEmail = order.customerInfo?.email || "غير محدد";
      return <div>{customerEmail}</div>;
    },
  },
  {
    id: "customerPhone",
    accessorFn: (row) => row.phoneNumber || row.customerInfo?.phone || "غير محدد",
    header: "رقم الهاتف",
    cell: ({ row }) => {
      const order = row.original;
      const phone = order.phoneNumber || order.customerInfo?.phone || "غير محدد";
      return <div>{phone}</div>;
    },
  },
  {
    id: "address",
    accessorFn: (row) => `${row.address}, ${row.city}`,
    header: "العنوان",
    cell: ({ row }) => {
      const order = row.original;
      const fullAddress = `${order.address}, ${order.city}`;
      return <div className="max-w-[200px] truncate" title={fullAddress}>{fullAddress}</div>;
    },
  },
  // كوبون
  {
    header: 'كوبون',
    accessorKey: 'couponDetails',
    cell: ({ row }) => {
      const coupon = row.original.couponDetails;
      return coupon?.code ? (
        <div className="font-mono font-bold text-primary">{coupon.code}</div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  // صورة التحويل
  {
    header: 'صورة التحويل',
    accessorKey: 'transferProof',
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
            <span>عرض</span>
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
  // خصم
  {
    header: 'الخصم',
    accessorKey: 'discountAmount',
    cell: ({ row }) => {
      const value = row.original.discountAmount;
      return value ? (
        <span className="text-green-600 font-semibold">-{new Intl.NumberFormat("en-SD", {
          minimumFractionDigits: 2,
        }).format(value)} ج.س</span>
      ) : '-';
    },
  },
  // المجموع بعد الخصم
  {
    header: 'المجموع النهائي',
    accessorKey: 'finalAmount',
    cell: ({ row }) => {
      const value = row.original.finalAmount;
      return value ? `${value} ج.س` : '-';
    },
  },
  {
    id: "productsCount",
    accessorFn: (row) => row.productsCount || row.products?.length || 0,
    header: "عدد المنتجات",
    cell: ({ row }) => {
      const order = row.original;
      const productCount = order.productsCount || order.products?.length || 0;
      return <div className="text-green-600">{productCount}</div>;
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "حالة الدفع",
    cell: ({ row }) => {
      const paymentStatus = row.getValue("paymentStatus") as string;
      return (
        <div className="capitalize">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              paymentStatus === "paid"
                ? "bg-green-100 text-green-800"
                : paymentStatus === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {getPaymentStatusInArabic(paymentStatus)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right justify-end"
        >
          المجموع
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount"));
      const formatted = new Intl.NumberFormat("en-SD", {
        minimumFractionDigits: 2,
      }).format(amount);

      return <div className="font-medium">{formatted} ج.س</div>;
    },
  },
  {
    accessorKey: "orderDate",
    header: "تاريخ الطلب",
    cell: ({ row }) => {
      const date = row.getValue("orderDate") as string;
      return <div className="text-sm">{formatDate(date)}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const order = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">فتح القائمة</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>العمليات</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order._id)}
            >
              نسخ معرف الطلب
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* في حال أردت فتح الـ OrderDialog من هنا أيضًا، يمكنك استخدام handleRowClick */}
            <DropdownMenuItem onClick={() => {
                // يمكنك استدعاء handleRowClick مباشرة إذا كانت متاحة في هذا النطاق
                // أو تمرير دالة لفتح المودال من هنا
                // حالياً، النقر على الصف يفتح المودال، لذا هذه قد تكون زائدة أو تحتاج لتعديل
            }}>عرض التفاصيل</DropdownMenuItem>
            <DropdownMenuItem>تعديل الطلب</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function DataTable({ orders }: { orders: Order[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedRow, setSelectedRow] = React.useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleRowClick = (order: Order) => {
    setSelectedRow(order);
    setIsModalOpen(true);
  };

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
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="البحث برقم الطلب..."
          value={(table.getColumn("orderNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("orderNumber")?.setFilterValue(event.target.value)
          }
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
              .filter((column) => column.getCanHide())
              .map((column) => {
                const columnLabels: Record<string, string> = {
                  orderNumber: "رقم الطلب",
                  status: "الحالة",
                  customerName: "اسم العميل",
                  customerEmail: "البريد الالكتروني", // أضف هذا
                  customerPhone: "رقم الهاتف",
                  address: "العنوان",
                  paymentStatus: "حالة الدفع",
                  totalAmount: "المجموع",
                  productsCount: "عدد المنتجات",
                  orderDate: "تاريخ الطلب",
                  transferProof: "صورة التحويل",
                  couponDetails: "كوبون",
                  discountAmount: "الخصم",
                  finalAmount: "المجموع النهائي",
                };

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {columnLabels[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
          {table.getFilteredSelectedRowModel().rows.length} من{" "}
          {table.getFilteredRowModel().rows.length} صف محدد.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            التالي
          </Button>
        </div>
      </div>

      <OrderDialog isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} selectedRow={selectedRow}/>
    </div>
  );
}

// Example usage with sample data
const sampleOrder: Order = {
  _id: '685d09019b2c3be0dce01fd5',
  user: { _id: '68343632f869e2caa87b51b2' },
  products: [{ quantity: 1, product: { name: 'منتج تجريبي', price: 240000 } }],
  totalAmount: 240000,
  status: 'pending',
  phoneNumber: '0931873492',
  address: 'الحاح يوسف',
  city: 'الخرطوم',
  paymentMethod: 'cash',
  paymentStatus: 'pending',
  orderNumber: 'ORD-0031',
  orderDate: '2025-06-26T08:46:57.411Z',
  createdAt: '2025-06-26T08:46:57.412Z',
  updatedAt: '2025-06-26T08:46:57.412Z',
  __v: 0,
  productsCount: 1,
  customerInfo: { name: 'اسم العميل', email: 'email@example.com', phone: '0931873492' }, // تم تحديث هنا ليعكس البيانات الحقيقية
  productsDetails: [{ name: 'منتج تجريبي', quantity: 1, price: 240000 }]
};

export default function App() {
  return (
    <div className="container mx-auto py-10">
      <DataTable orders={[sampleOrder]} />
    </div>
  );
}