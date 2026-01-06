"use client";

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

import OrderDialog from "@/app/business/orders/orderDialog";

export type OrderProduct = {
  product: {
    _id: string;
    name: string;
    price: number;
    quantity: number;
  };
  quantity: number;
};

export type OrderUser = {
  _id: string;
  fullName: string;
  emailAddress: string;
};

export type Order = {
  _id: string;
  user: OrderUser;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  deliveryAddress: string;
  paymentMethod: "cash" | "card";
  paymentStatus: "pending" | "paid" | "failed";
  totalAmount: number;
  products: OrderProduct[];
  orderNumber: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
};

// Helper function to get status in Arabic
const getStatusInArabic = (status: string) => {
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
const getPaymentStatusInArabic = (paymentStatus: string) => {
  const statusMap: Record<string, string> = {
    pending: "دفع عند الاستلام",
    paid: "مدفوع",
    failed: "فشل",
  };
  return statusMap[paymentStatus] || paymentStatus;
};

// ====== COLUMNS
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
                ? "bg-success/10 text-success"
                : status === "shipped"
                ? "bg-accent/10 text-accent"
                : status === "confirmed"
                ? "bg-warning/10 text-warning"
                : status === "cancelled"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
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
    accessorFn: (row) => row.user?.fullName || "غير محدد",
    header: "اسم العميل",
    cell: ({ row }) => {
      const order = row.original;
      const customerName = order.user?.fullName || "غير محدد";
      return <div className="capitalize">{customerName}</div>;
    },
  },
  {
    id: "customerEmail",
    accessorFn: (row) => row.user?.emailAddress || "غير محدد",
    header: "البريد الالكتروني",
    cell: ({ row }) => {
      const order = row.original;
      const customerEmail = order.user?.emailAddress || "غير محدد";
      return <div className="link decoration-none">{customerEmail}</div>;
    },
  },
  {
    id: "productsCount",
    header: "عدد المنتجات",
    cell: ({ row }) => {
      const order = row.original;
      const productCount = order.products.length;
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
            <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
            <DropdownMenuItem>تعديل الطلب</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function DataTable({ orders }: { orders: Order[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleRowClick = (row: any) => {
    setSelectedRow(row);
    (selectedRow);
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
          value={
            (table.getColumn("orderNumber")?.getFilterValue() as string) ?? ""
          }
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
                  customerEmail: "البريد الالكتروني",
                  paymentStatus: "حالة الدفع",
                  totalAmount: "المجموع",
                  products: "المنتجات",
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
                  <TableHead key={header.id} className="">
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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
