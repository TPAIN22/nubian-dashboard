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
import { ArrowUpDown, ChevronDown, Check, X, Ban, Trash2, MoreHorizontal, RotateCcw } from "lucide-react";
import { axiosInstance } from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// API Response interfaces
interface ApiSuccessResponse {
  success: true;
  data?: any;
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  message?: string;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

/**
 * Mirrors the Merchant document as `GET /merchants` returns it (raw, no
 * projection). The field names are the model's — there is no `business*`
 * anything — and `status` is the model's lowercase enum. Compare it through
 * `normalizeStatus`, never with a literal `=== "APPROVED"`.
 */
export type MerchantStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_revision"
  | "suspended";

export type Merchant = {
  _id: string;
  userId: string;
  storeName: string;
  ownerName?: string;
  description?: string;
  email: string;
  phone?: string;
  city?: string;
  status: MerchantStatus;
  rejectionReason?: string;
  revisionNotes?: string;
  suspensionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
};

/** Tolerates legacy uppercase rows that may still be sitting in the database. */
const normalizeStatus = (status?: string): string => (status ?? "").toLowerCase();

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "قيد المراجعة", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300" },
  approved: { label: "موافق عليه", className: "bg-green-500/15 text-green-700 dark:text-green-300" },
  rejected: { label: "مرفوض", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
  needs_revision: { label: "يحتاج تعديل", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  suspended: { label: "معلق", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
};

// Separate component for merchant actions to fix React hooks rules
function MerchantActions({ merchant }: { merchant: Merchant }) {
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [suspensionReason, setSuspensionReason] = React.useState("");
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [isSuspending, setIsSuspending] = React.useState(false);
  const [isUnsuspending, setIsUnsuspending] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/merchants/${merchant._id}/approve`, {
        method: 'PATCH',
      });
      const data = await response.json() as ApiResponse;
      if (!response.ok) {
        const errorMessage = data.message || (data as ApiErrorResponse).error?.message || 'Failed to approve';
        throw new Error(errorMessage);
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
      const data = await response.json() as ApiResponse;
      if (!response.ok) {
        const errorMessage = data.message || (data as ApiErrorResponse).error?.message || 'Failed to reject';
        throw new Error(errorMessage);
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

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      toast.error("يرجى إدخال سبب التعليق");
      return;
    }
    setIsSuspending(true);
    try {
      const response = await fetch(`/api/merchants/${merchant._id}/suspend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suspensionReason: suspensionReason.trim() }),
      });

      const data = await response.json() as ApiResponse;

      if (!response.ok) {
        const errorMessage = data.message || (data as ApiErrorResponse).error?.message || `فشل في تعليق التاجر (${response.status})`;
        throw new Error(errorMessage);
      }

      toast.success("تم تعليق التاجر بنجاح");
      setSuspensionReason("");
      router.refresh();
    } catch (error: any) {
      const errorMessage = error.message || "فشل في تعليق التاجر. يرجى المحاولة مرة أخرى.";
      toast.error(errorMessage);
    } finally {
      setIsSuspending(false);
    }
  };

  const handleUnsuspend = async () => {
    setIsUnsuspending(true);
    try {
      const response = await fetch(`/api/merchants/${merchant._id}/unsuspend`, {
        method: 'PATCH',
      });
      const data = await response.json() as ApiResponse;
      if (!response.ok) {
        const errorMessage = data.message || (data as ApiErrorResponse).error?.message || 'Failed to unsuspend';
        throw new Error(errorMessage);
      }
      toast.success("تم إلغاء تعليق التاجر بنجاح");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "فشل في إلغاء تعليق التاجر");
    } finally {
      setIsUnsuspending(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/merchants/${merchant._id}/delete`, {
        method: 'DELETE',
      });
      const data = await response.json() as ApiResponse;
      if (!response.ok) {
        const errorMessage = data.message || (data as ApiErrorResponse).error?.message || 'Failed to delete';
        throw new Error(errorMessage);
      }
      toast.success("تم حذف التاجر بنجاح");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "فشل في حذف التاجر");
    } finally {
      setIsDeleting(false);
    }
  };

  // Show actions based on status
  const status = normalizeStatus(merchant.status);

  if (status === "approved") {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">فتح القائمة</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Ban className="h-4 w-4 ml-2" />
                  تعليق التاجر
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تعليق التاجر</AlertDialogTitle>
                  <AlertDialogDescription>
                    يرجى إدخال سبب تعليق التاجر <strong>{merchant.storeName}</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="سبب التعليق..."
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setSuspensionReason("")}>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSuspend} disabled={isSuspending || !suspensionReason.trim()}>
                    {isSuspending ? "جاري المعالجة..." : "تعليق"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف التاجر
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من حذف التاجر <strong>{merchant.storeName}</strong>؟ 
                    هذا الإجراء لا يمكن التراجع عنه.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isDeleting ? "جاري الحذف..." : "حذف"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {(status === "pending" || status === "needs_revision") && (
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
                  هل أنت متأكد من الموافقة على طلب التاجر <strong>{merchant.storeName}</strong>؟
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
                  يرجى إدخال سبب رفض طلب التاجر <strong>{merchant.storeName}</strong>.
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
      {status === "rejected" && merchant.rejectionReason && (
        <div className="text-xs text-muted-foreground max-w-[200px]">
          سبب الرفض: {merchant.rejectionReason}
        </div>
      )}
      {status === "suspended" && (
        <div className="flex items-center gap-2">
          {merchant.suspensionReason && (
            <div className="text-xs text-muted-foreground max-w-[200px]">
              سبب التعليق: {merchant.suspensionReason}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">فتح القائمة</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <RotateCcw className="h-4 w-4 ml-2" />
                    إلغاء التعليق
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>إلغاء تعليق التاجر</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من إلغاء تعليق التاجر <strong>{merchant.storeName}</strong>؟
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnsuspend} disabled={isUnsuspending}>
                      {isUnsuspending ? "جاري المعالجة..." : "إلغاء التعليق"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف التاجر
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من حذف التاجر <strong>{merchant.storeName}</strong>؟ 
                      هذا الإجراء لا يمكن التراجع عنه.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {isDeleting ? "جاري الحذف..." : "حذف"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// Client component for date formatting to avoid hydration mismatches
function DateCell({ dateString }: { dateString: string }) {
  const [formatted, setFormatted] = React.useState(dateString);
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const formattedDate = date.toLocaleDateString('ar-SD', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        setFormatted(formattedDate);
      }
    } catch (error) {
      // Keep original dateString on error
    }
  }, [dateString]);
  
  // Use suppressHydrationWarning to prevent warnings from browser extensions
  // that modify the DOM (like form fillers adding fdprocessedid attributes)
  return (
    <div className="text-sm" suppressHydrationWarning>
      {mounted ? formatted : dateString}
    </div>
  );
}

// Legacy formatDate function for backward compatibility (use DateCell component instead)
export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('ar-SD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
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
    accessorKey: "storeName",
    header: "اسم المتجر",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("storeName")}</div>
    ),
  },
  {
    accessorKey: "ownerName",
    header: "اسم المالك",
    cell: ({ row }) => (
      <div>{row.getValue("ownerName") || "غير محدد"}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "البريد الإلكتروني",
    cell: ({ row }) => (
      <div>{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "phone",
    header: "رقم الهاتف",
    cell: ({ row }) => (
      <div>{row.getValue("phone") || "غير محدد"}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
      const status = normalizeStatus(row.getValue("status") as string);
      const statusInfo = STATUS_BADGES[status] || {
        label: status,
        className: "bg-muted text-muted-foreground",
      };

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
    // The model has no `appliedAt` — it relies on Mongoose timestamps, so the
    // application date is `createdAt`. The old accessor rendered undefined.
    accessorKey: "createdAt",
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
      const date = row.getValue("createdAt") as string;
      return <DateCell dateString={date} />;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const merchant = row.original;
      return <MerchantActions merchant={merchant} />;
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
    return merchants.filter((m) => normalizeStatus(m.status) === statusFilter);
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
          placeholder="البحث باسم المتجر..."
          value={(table.getColumn("storeName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("storeName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {statusFilter === "all"
                ? "جميع الحالات"
                : STATUS_BADGES[statusFilter]?.label ?? statusFilter}
              <ChevronDown className="mr-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>جميع الحالات</DropdownMenuItem>
            {Object.entries(STATUS_BADGES).map(([value, { label }]) => (
              <DropdownMenuItem key={value} onClick={() => setStatusFilter(value)}>
                {label}
              </DropdownMenuItem>
            ))}
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
                  storeName: "اسم المتجر",
                  ownerName: "اسم المالك",
                  email: "البريد الإلكتروني",
                  phone: "رقم الهاتف",
                  status: "الحالة",
                  createdAt: "تاريخ التقديم",
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

