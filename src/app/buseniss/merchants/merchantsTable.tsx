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
import { ArrowUpDown, ChevronDown, Check, X } from "lucide-react";
import { axiosInstance } from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export type Merchant = {
  _id: string;
  clerkId: string;
  businessName: string;
  businessDescription?: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  appliedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

export const columns: ColumnDef<Merchant>[] = [
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
    accessorKey: "businessName",
    header: "اسم العمل",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("businessName")}</div>
    ),
  },
  {
    accessorKey: "businessEmail",
    header: "البريد الإلكتروني",
    cell: ({ row }) => (
      <div>{row.getValue("businessEmail")}</div>
    ),
  },
  {
    accessorKey: "businessPhone",
    header: "رقم الهاتف",
    cell: ({ row }) => (
      <div>{row.getValue("businessPhone") || "غير محدد"}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusMap: Record<string, { label: string; className: string }> = {
        PENDING: { label: "قيد المراجعة", className: "bg-yellow-100 text-yellow-800" },
        APPROVED: { label: "موافق عليه", className: "bg-green-100 text-green-800" },
        REJECTED: { label: "مرفوض", className: "bg-red-100 text-red-800" },
      };
      const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
      
      return (
        <div className="capitalize">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "appliedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          تاريخ التقديم
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("appliedAt") as string;
      return <div className="text-sm">{formatDate(date)}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const merchant = row.original;
      const [rejectionReason, setRejectionReason] = React.useState("");
      const [isApproving, setIsApproving] = React.useState(false);
      const [isRejecting, setIsRejecting] = React.useState(false);
      const router = useRouter();

      const handleApprove = async () => {
        setIsApproving(true);
        try {
          const response = await fetch(`/api/merchants/${merchant._id}/approve`, {
            method: 'PATCH',
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Failed to approve');
          }
          toast.success("تم الموافقة على التاجر بنجاح");
          router.refresh();
        } catch (error: any) {
          toast.error(error.message || "فشل في الموافقة على التاجر");
        } finally {
          setIsApproving(false);
        }
      };

      const handleReject = async () => {
        if (!rejectionReason.trim()) {
          toast.error("يرجى إدخال سبب الرفض");
          return;
        }
        setIsRejecting(true);
        try {
          const response = await fetch(`/api/merchants/${merchant._id}/reject`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rejectionReason }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Failed to reject');
          }
          toast.success("تم رفض التاجر بنجاح");
          router.refresh();
        } catch (error: any) {
          toast.error(error.message || "فشل في رفض التاجر");
        } finally {
          setIsRejecting(false);
          setRejectionReason("");
        }
      };

      if (merchant.status === "APPROVED") {
        return (
          <div className="text-sm text-muted-foreground">موافق عليه</div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          {merchant.status === "PENDING" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="default" className="h-8">
                    <Check className="h-4 w-4 mr-1" />
                    موافقة
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد الموافقة</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من الموافقة على طلب التاجر <strong>{merchant.businessName}</strong>؟
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
                      {isApproving ? "جاري المعالجة..." : "موافقة"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="h-8">
                    <X className="h-4 w-4 mr-1" />
                    رفض
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>رفض الطلب</AlertDialogTitle>
                    <AlertDialogDescription>
                      يرجى إدخال سبب رفض طلب التاجر <strong>{merchant.businessName}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="سبب الرفض..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setRejectionReason("")}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReject} disabled={isRejecting || !rejectionReason.trim()}>
                      {isRejecting ? "جاري المعالجة..." : "رفض"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {merchant.status === "REJECTED" && merchant.rejectionReason && (
            <div className="text-xs text-muted-foreground max-w-[200px]">
              سبب الرفض: {merchant.rejectionReason}
            </div>
          )}
        </div>
      );
    },
  },
];

export function MerchantsTable({ merchants }: { merchants: Merchant[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredMerchants = React.useMemo(() => {
    if (statusFilter === "all") return merchants;
    return merchants.filter(m => m.status === statusFilter);
  }, [merchants, statusFilter]);

  const table = useReactTable({
    data: filteredMerchants,
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
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="البحث باسم العمل..."
          value={(table.getColumn("businessName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("businessName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {statusFilter === "all" ? "جميع الحالات" : 
               statusFilter === "PENDING" ? "قيد المراجعة" :
               statusFilter === "APPROVED" ? "موافق عليه" : "مرفوض"}
              <ChevronDown className="mr-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>جميع الحالات</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>قيد المراجعة</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("APPROVED")}>موافق عليه</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("REJECTED")}>مرفوض</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              إخفاء/إظهار <ChevronDown className="mr-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const columnLabels: Record<string, string> = {
                  businessName: "اسم العمل",
                  businessEmail: "البريد الإلكتروني",
                  businessPhone: "رقم الهاتف",
                  status: "الحالة",
                  appliedAt: "تاريخ التقديم",
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
    </div>
  );
}

