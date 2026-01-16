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

import type { Order, OrderStatus, PaymentStatus } from "./types";
import { getStatusInArabic, getPaymentStatusInArabic, getPaymentMethodArabic, formatDate, formatMoney, getOrderTotal, getItemsCount, getCustomerName, getCustomerEmail, getCustomerPhone, getAddressText, getMerchantNames } from "./types";

// ─────────────────────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────────────────────

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
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  return (
    <div className="w-full">
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
    </div>
  );
}

export default function App() {
  return null;
}
