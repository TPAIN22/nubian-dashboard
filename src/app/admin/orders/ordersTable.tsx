"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type RowData,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  Copy,
  Eye,
  MoreHorizontal,
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/EmptyState";
import logger from "@/lib/logger";
import { cn } from "@/lib/utils";

import { OrderStatusBadge, PaymentStatusBadge } from "./orderBadges";
import { OrderDetailsDrawer } from "./orderDetailsDrawer";
import { OrderItemsCell } from "./orderItemsCell";
import { getPaymentMethodLabel } from "./orderStatus";
import { updateOrderStatus, type AdminOrderStatus } from "./orderControler";
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
} from "./types";

declare module "@tanstack/react-table" {
  // Column headers are Arabic, but TanStack only knows a column by its id. The
  // visibility menu used to print those raw ids ("customerEmail") into an
  // Arabic UI; `meta.label` gives every column a human name to render instead.
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
  }

  // `meta.openOrder` is how a cell reaches the drawer without the column array
  // having to be rebuilt whenever the handler identity changes.
  interface TableMeta<TData extends RowData> {
    openOrder?: (order: Order) => void;
  }
}

const COLUMN_VISIBILITY_KEY = "nubian:admin-orders:column-visibility";

/**
 * Columns an operator rarely needs at a glance. They stay one click away in the
 * visibility menu — the table is far easier to scan at nine columns than at
 * fourteen, and everything hidden here is shown in full inside the drawer.
 */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  customerEmail: false,
  paymentMethod: false,
  merchants: false,
  address: false,
  transferProof: false,
  itemsCount: false,
};

const SKELETON_ROWS = 6;

/**
 * Search across the fields support actually pastes into a search box.
 *
 * Scoped to the rows currently loaded — the backend's `/orders/admin` takes no
 * search parameter, so this cannot reach beyond the current page. The input is
 * labelled accordingly rather than pretending to be a global search.
 */
const orderSearchFilter: FilterFn<Order> = (row, _columnId, rawValue) => {
  const needle = String(rawValue ?? "").trim().toLowerCase();
  if (!needle) return true;

  const order = row.original;
  const haystack = [
    order.orderNumber,
    order._id,
    getCustomerName(order),
    getCustomerEmail(order),
    getCustomerPhone(order),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
};

// ─────────────────────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────────────────────

/**
 * Built once at module scope rather than per render. TanStack treats a new
 * column array as a new table definition and throws away its memoised row
 * models, which on a 20-row page with thumbnails is a visible re-render on
 * every keystroke in the search box. Row-level actions reach the drawer
 * through the row click instead of a captured closure, so nothing here needs
 * to close over component state.
 */
const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="تحديد كل الطلبات"
      />
    ),
    cell: ({ row }) => (
      // The wrapper swallows the click so ticking a row doesn't also open its
      // drawer — the old table opened the dialog on every checkbox tick.
      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={`تحديد الطلب ${row.original.orderNumber || row.original._id}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  {
    accessorKey: "orderNumber",
    header: "رقم الطلب",
    meta: { label: "رقم الطلب" },
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium">
        {row.original.orderNumber || row.original._id}
      </span>
    ),
  },

  {
    id: "customer",
    header: "العميل",
    meta: { label: "العميل" },
    accessorFn: (row) => getCustomerName(row),
    cell: ({ row }) => (
      <div className="max-w-[170px]">
        <div className="truncate text-sm font-medium" title={getCustomerName(row.original)}>
          {getCustomerName(row.original)}
        </div>
        <div className="truncate text-xs text-muted-foreground" dir="ltr">
          {getCustomerPhone(row.original)}
        </div>
      </div>
    ),
  },

  {
    id: "items",
    header: "المنتجات",
    meta: { label: "المنتجات" },
    enableSorting: false,
    cell: ({ row }) => <OrderItemsCell lines={getOrderLines(row.original)} />,
  },

  {
    accessorKey: "status",
    header: "حالة الطلب",
    meta: { label: "حالة الطلب" },
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },

  {
    id: "paymentStatus",
    header: "حالة الدفع",
    meta: { label: "حالة الدفع" },
    accessorFn: (row) => row.paymentStatus || "",
    cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
  },

  {
    id: "total",
    meta: { label: "الإجمالي" },
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-mx-2 h-7 px-2 font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        الإجمالي
        <ArrowUpDown className="size-3.5 opacity-60" />
      </Button>
    ),
    accessorFn: (row) => getOrderTotal(row),
    cell: ({ row }) => (
      <span className="text-sm font-semibold tabular-nums">
        {formatMoney(getOrderTotal(row.original), getOrderCurrency(row.original))}
      </span>
    ),
  },

  {
    id: "createdAt",
    meta: { label: "تاريخ الطلب" },
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-mx-2 h-7 px-2 font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        تاريخ الطلب
        <ArrowUpDown className="size-3.5 opacity-60" />
      </Button>
    ),
    accessorFn: (row) => new Date(row.createdAt || row.orderDate || 0).getTime(),
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {formatDate(row.original.createdAt || row.original.orderDate)}
      </span>
    ),
  },

  // ── Hidden by default; available from the visibility menu ──

  {
    id: "customerEmail",
    header: "البريد الإلكتروني",
    meta: { label: "البريد الإلكتروني" },
    accessorFn: (row) => getCustomerEmail(row),
    cell: ({ row }) => (
      <span className="block max-w-[200px] truncate text-xs" dir="ltr">
        {getCustomerEmail(row.original)}
      </span>
    ),
  },

  {
    id: "paymentMethod",
    header: "طريقة الدفع",
    meta: { label: "طريقة الدفع" },
    accessorFn: (row) => row.paymentMethod || "",
    cell: ({ row }) => (
      <span className="text-xs">{getPaymentMethodLabel(row.original.paymentMethod)}</span>
    ),
  },

  {
    id: "merchants",
    header: "التاجر",
    meta: { label: "التاجر" },
    accessorFn: (row) => getMerchantNames(row),
    cell: ({ row }) => (
      <span
        className="block max-w-[180px] truncate text-xs"
        title={getMerchantNames(row.original)}
      >
        {getMerchantNames(row.original)}
      </span>
    ),
  },

  {
    id: "address",
    header: "العنوان",
    meta: { label: "العنوان" },
    accessorFn: (row) => getAddressText(row),
    cell: ({ row }) => (
      <span className="block max-w-[220px] truncate text-xs" title={getAddressText(row.original)}>
        {getAddressText(row.original)}
      </span>
    ),
  },

  {
    id: "itemsCount",
    header: "عدد القطع",
    meta: { label: "عدد القطع" },
    accessorFn: (row) => getItemsCount(row),
    cell: ({ row }) => (
      <span className="text-sm font-medium tabular-nums">{getItemsCount(row.original)}</span>
    ),
  },

  {
    id: "transferProof",
    header: "صورة التحويل",
    meta: { label: "صورة التحويل" },
    enableSorting: false,
    cell: ({ row }) =>
      row.original.transferProof ? (
        <a
          href={row.original.transferProof}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-primary hover:underline"
        >
          عرض
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },

  {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    size: 40,
    cell: ({ row, table }) => {
      const order = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => e.stopPropagation()}
              aria-label={`عمليات الطلب ${order.orderNumber || order._id}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>العمليات</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => table.options.meta?.openOrder?.(order)}>
              <Eye className="size-4" />
              عرض التفاصيل
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(order._id);
                  toast.success("تم نسخ معرف الطلب");
                } catch {
                  toast.error("تعذّر النسخ إلى الحافظة");
                }
              }}
            >
              <Copy className="size-4" />
              نسخ معرف الطلب
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// ─────────────────────────────────────────────────────────────
// Bulk actions
// ─────────────────────────────────────────────────────────────

const adminStatusOptions: { value: AdminOrderStatus; label: string }[] = [
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "AWAITING_PAYMENT_CONFIRMATION", label: "انتظار تأكيد الدفع" },
  { value: "CONFIRMED", label: "مؤكد" },
  { value: "PROCESSING", label: "قيد المعالجة" },
  { value: "SHIPPED", label: "تم الشحن" },
  { value: "DELIVERED", label: "تم التسليم" },
  { value: "CANCELLED", label: "ملغي" },
  { value: "PAYMENT_FAILED", label: "فشل الدفع" },
];

function BulkActions({
  selectedOrders,
  onActionComplete,
  onClear,
}: {
  selectedOrders: Order[];
  onActionComplete: () => void;
  onClear: () => void;
}) {
  const [busy, setBusy] = React.useState(false);

  const handleBulkStatusUpdate = async (newStatus: AdminOrderStatus) => {
    setBusy(true);
    try {
      // Each order gets its own idempotency key (the helper handles this), so a
      // duplicate click won't double-apply the change for any one order.
      // `allSettled` so one rejected order doesn't hide the rest's outcome.
      const results = await Promise.allSettled(
        selectedOrders.map((order) => updateOrderStatus(order._id, newStatus)),
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed === 0) {
        toast.success(`تم تحديث حالة ${selectedOrders.length} طلب بنجاح`);
      } else {
        toast.warning(`تم تحديث ${selectedOrders.length - failed} طلب، وفشل ${failed}`);
      }
      onActionComplete();
    } catch (error: any) {
      logger.error("Error updating bulk order status", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error("فشل تحديث حالة الطلبات");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
      <span className="text-sm font-medium">تم تحديد {selectedOrders.length} طلب</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={busy}>
            {busy ? "جاري التحديث..." : "تحديث الحالة"}
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
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

      <Button variant="ghost" size="sm" onClick={onClear} disabled={busy} className="ms-auto">
        <X className="size-3.5" />
        إلغاء التحديد
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DataTableProps {
  orders: Order[];
  onRefresh?: () => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  /** First load — renders skeleton rows in place of the body. */
  isLoading?: boolean;
  /** Background refetch — dims the body but keeps it interactive. */
  isRefreshing?: boolean;
}

export function DataTable({
  orders,
  onRefresh,
  pagination,
  onPageChange,
  isLoading = false,
  isRefreshing = false,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY);
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Restore after mount, never during render: reading localStorage in a state
  // initializer would make the server and client markup disagree.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLUMN_VISIBILITY_KEY);
      if (stored) setColumnVisibility({ ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(stored) });
    } catch {
      // Corrupt or unavailable storage — the defaults are already applied.
    }
  }, []);

  const persistVisibility = React.useCallback((next: VisibilityState) => {
    try {
      window.localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(next));
    } catch {
      // Private mode / quota — preference just won't survive the session.
    }
  }, []);

  const openOrder = React.useCallback((order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  }, []);

  // Server-driven pagination when the parent passes meta; otherwise fall back
  // to the client row model so the table still works where it isn't wired.
  const useServerPagination = !!pagination && !!onPageChange;

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting, globalFilter, columnVisibility, rowSelection },
    // Row identity must survive a refetch, otherwise selections jump to
    // whichever orders happen to land on the same indexes.
    getRowId: (row) => row._id,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persistVisibility(next);
        return next;
      });
    },
    onRowSelectionChange: setRowSelection,
    globalFilterFn: orderSearchFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(useServerPagination
      ? { manualPagination: true, pageCount: pagination!.totalPages }
      : { getPaginationRowModel: getPaginationRowModel() }),
    meta: { openOrder },
  });

  const rows = table.getRowModel().rows;
  const selectedOrders = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const visibleColumns = table.getVisibleFlatColumns();
  const visibleColumnCount = visibleColumns.length;
  const isEmpty = !isLoading && rows.length === 0;

  return (
    <div className="w-full">
      {selectedOrders.length > 0 ? (
        <BulkActions
          selectedOrders={selectedOrders}
          onClear={() => table.resetRowSelection()}
          onActionComplete={() => {
            table.resetRowSelection();
            onRefresh?.();
          }}
        />
      ) : null}

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            // Honest label: the backend takes no search param, so this only
            // narrows the page that's already loaded.
            placeholder="بحث في هذه الصفحة (رقم الطلب، العميل، الهاتف)..."
            aria-label="بحث في الطلبات المعروضة"
            className="ps-9"
          />
          {globalFilter ? (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              aria-label="مسح البحث"
              className="absolute inset-y-0 end-3 my-auto text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ms-auto">
              <SlidersHorizontal className="size-4" />
              الأعمدة
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>إظهار الأعمدة</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.columnDef.meta?.label ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Desktop table ── */}
      <div
        className={cn(
          "hidden overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm md:block",
          isRefreshing && "opacity-70 transition-opacity",
        )}
      >
        <Table
          // Bounding the scroll container is what lets the header stick: it is
          // the nearest scrollport, so `sticky top-0` anchors to it.
          containerClassName="max-h-[calc(100vh-20rem)]"
        >
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:border-b [&_th]:bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 px-3">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} className="px-3 py-3">
                      {/* Match the real cell's footprint so the layout doesn't
                          jump when data lands. */}
                      <Skeleton
                        className={column.id === "items" ? "h-[104px] w-[200px]" : "h-4 w-24"}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isEmpty ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumnCount} className="whitespace-normal p-0">
                  <EmptyState
                    className="min-h-[320px] rounded-none border-0 hover:bg-transparent"
                    icon={<PackageSearch className="size-9 text-muted-foreground" />}
                    title={globalFilter ? "لا توجد نتائج مطابقة" : "لا توجد طلبات"}
                    description={
                      globalFilter
                        ? "جرّب مصطلح بحث آخر، أو امسح البحث لعرض كل طلبات هذه الصفحة."
                        : "لم يتم تسجيل أي طلب بهذه الحالة بعد. ستظهر الطلبات الجديدة هنا فور وصولها."
                    }
                    action={
                      globalFilter ? (
                        <Button variant="outline" size="sm" onClick={() => setGlobalFilter("")}>
                          مسح البحث
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  role="button"
                  tabIndex={0}
                  aria-label={`عرض تفاصيل الطلب ${row.original.orderNumber || row.original._id}`}
                  onClick={() => openOrder(row.original)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openOrder(row.original);
                    }
                  }}
                  className="cursor-pointer align-middle transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=selected]:bg-primary/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile cards ── */}
      <div className={cn("space-y-3 md:hidden", isRefreshing && "opacity-70")}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`m-skeleton-${i}`} className="h-32 w-full rounded-xl" />
          ))
        ) : isEmpty ? (
          <EmptyState
            className="min-h-[260px]"
            icon={<PackageSearch className="size-9 text-muted-foreground" />}
            title={globalFilter ? "لا توجد نتائج مطابقة" : "لا توجد طلبات"}
            description={
              globalFilter
                ? "جرّب مصطلح بحث آخر لعرض الطلبات."
                : "ستظهر الطلبات الجديدة هنا فور وصولها."
            }
          />
        ) : (
          rows.map((row) => <OrderCard key={row.id} order={row.original} onOpen={openOrder} />)
        )}
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <p className="text-sm text-muted-foreground">
          {useServerPagination
            ? `صفحة ${pagination!.page} من ${pagination!.totalPages || 1} • ${pagination!.total.toLocaleString()} طلب`
            : `${rows.length} طلب`}
          {selectedOrders.length > 0 ? ` • ${selectedOrders.length} محدد` : ""}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (useServerPagination) onPageChange!(Math.max(1, pagination!.page - 1));
              else table.previousPage();
            }}
            disabled={useServerPagination ? pagination!.page <= 1 : !table.getCanPreviousPage()}
          >
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (useServerPagination) onPageChange!(pagination!.page + 1);
              else table.nextPage();
            }}
            disabled={
              useServerPagination
                ? pagination!.page >= pagination!.totalPages
                : !table.getCanNextPage()
            }
          >
            التالي
          </Button>
        </div>
      </div>

      <OrderDetailsDrawer
        order={selectedOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onChanged={onRefresh}
      />
    </div>
  );
}

/**
 * Mobile row. A table with a product preview can't shrink to a phone, so below
 * `md` the same data is stacked into a tappable card that opens the same drawer.
 *
 * A `div` with `role="button"` rather than a real `<button>`: the items cell
 * contains its own focusable overflow control, and nesting one button inside
 * another is invalid HTML that browsers resolve unpredictably.
 */
function OrderCard({ order, onOpen }: { order: Order; onOpen: (order: Order) => void }) {
  const lines = getOrderLines(order);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`عرض تفاصيل الطلب ${order.orderNumber || order._id}`}
      onClick={() => onOpen(order)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(order);
        }
      }}
      className="w-full cursor-pointer rounded-xl border border-border/60 bg-card p-4 text-start shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium">{order.orderNumber || order._id}</p>
          <p className="mt-0.5 truncate text-sm font-medium">{getCustomerName(order)}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {formatMoney(getOrderTotal(order), getOrderCurrency(order))}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <div className="mt-3 border-t border-border/60 pt-3">
        <OrderItemsCell lines={lines} className="w-full" overflowInteractive={false} />
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {formatDate(order.createdAt || order.orderDate)}
      </p>
    </div>
  );
}
