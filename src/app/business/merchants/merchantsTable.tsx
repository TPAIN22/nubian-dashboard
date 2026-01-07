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

export type Merchant = {
  _id: string;
  clerkId: string;
  businessName: string;
  businessDescription?: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  rejectionReason?: string;
  suspensionReason?: string;
  appliedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
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
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404 && data.error === 'SUSPEND_ENDPOINT_NOT_FOUND') {
          const backendInfo = data.details?.backendRequired 
            ? `\n\nالمطلوب في الخادم: ${data.details.backendRequired}`
            : '';
          throw new Error(`نقطة النهاية لتعليق التاجر غير متوفرة في الخادم.${backendInfo}`);
        }
        
        const errorMessage = data.message || data.error || `فشل في تعليق التاجر (${response.status})`;
        throw new Error(errorMessage);
      }
      
      // Check if workaround was used
      if (data._workaround) {
        toast.success("تم تعليق التاجر (استخدام حل مؤقت)", {
          description: "تم استخدام نقطة النهاية البديلة. يرجى إضافة نقطة النهاية المخصصة للتعليق في الخادم."
        });
      } else {
        toast.success("تم تعليق التاجر بنجاح");
      }
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
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to unsuspend');
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
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete');
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
  if (merchant.status === "APPROVED") {
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
                    يرجى إدخال سبب تعليق التاجر <strong>{merchant.businessName}</strong>.
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
                    هل أنت متأكد من حذف التاجر <strong>{merchant.businessName}</strong>؟ 
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
      {merchant.status === "SUSPENDED" && (
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
                      هل أنت متأكد من إلغاء تعليق التاجر <strong>{merchant.businessName}</strong>؟
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
                      هل أنت متأكد من حذف التاجر <strong>{merchant.businessName}</strong>؟ 
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
        SUSPENDED: { label: "معلق", className: "bg-orange-100 text-orange-800" },
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
               statusFilter === "APPROVED" ? "موافق عليه" :
               statusFilter === "SUSPENDED" ? "معلق" : "مرفوض"}
              <ChevronDown className="mr-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>جميع الحالات</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>قيد المراجعة</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("APPROVED")}>موافق عليه</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("SUSPENDED")}>معلق</DropdownMenuItem>
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

