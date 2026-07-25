"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { DataTable } from "./ordersTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Order, getOrderTotal, getOrderCurrency, formatMoney } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type OrderStatus =
  | 'all'
  | 'PENDING'
  | 'AWAITING_PAYMENT_CONFIRMATION'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED';

// Matches `pending` (lowercase legacy) and `PENDING` / `AWAITING_PAYMENT_CONFIRMATION`.
const PENDING_LIKE = new Set([
  'PENDING',
  'AWAITING_PAYMENT_CONFIRMATION',
  'PROCESSING',
  'pending',
]);

const DEFAULT_PAGE_SIZE = 20;

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusTabs: { value: OrderStatus; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'AWAITING_PAYMENT_CONFIRMATION', label: 'انتظار الدفع' },
  { value: 'CONFIRMED', label: 'مؤكد' },
  { value: 'PROCESSING', label: 'قيد المعالجة' },
  { value: 'SHIPPED', label: 'تم الشحن' },
  { value: 'DELIVERED', label: 'تم التسليم' },
  { value: 'CANCELLED', label: 'ملغي' },
  { value: 'PAYMENT_FAILED', label: 'فشل الدفع' },
];

export default function Page() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  // `loading` is the first paint only; `refreshing` covers every fetch after
  // it. Splitting them means changing a filter no longer blanks the whole page
  // — the toolbar, tabs and current rows stay put while the next page lands.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [page, setPage] = useState(1);

  // Server-side pagination. The backend caps `limit` at 100 and accepts an
  // optional `status` filter; we forward both. Tab counts reflect the
  // filtered total (`meta.pagination.total` from the response).
  const fetchOrders = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(DEFAULT_PAGE_SIZE),
      });
      if (selectedStatus !== 'all') params.set('status', selectedStatus);

      const res = await fetch(`/api/orders/admin?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || `فشل تحميل الطلبات (${res.status})`);
        return;
      }
      // Backend wraps the response: { success, data, meta: { pagination } }.
      // Tolerate both wrapped and bare shapes so this works if the envelope
      // ever changes upstream.
      const items: Order[] = Array.isArray(data?.data) ? data.data
        : Array.isArray(data) ? data
        : [];
      const meta = data?.meta?.pagination;
      setOrders(items);
      setPagination({
        page: meta?.page ?? page,
        limit: meta?.limit ?? DEFAULT_PAGE_SIZE,
        total: meta?.total ?? items.length,
        totalPages: meta?.totalPages ?? 1,
      });
    } catch (e: any) {
      console.error("Error fetching orders:", e);
      setError(e?.message || 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to page 1 when the user changes the status filter.
  useEffect(() => {
    setPage(1);
  }, [selectedStatus]);

  // Revenue card is necessarily approximate without a stats endpoint — we
  // only see the current page. Label it accordingly.
  const revenueByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      const code = getOrderCurrency(o);
      map[code] = (map[code] || 0) + (getOrderTotal(o) || 0);
    }
    return map;
  }, [orders]);

  const pendingOrders = orders.filter(order => PENDING_LIKE.has(order.status || '')).length;
  const todaysOrders = orders.filter(order => {
    const today = new Date().toDateString();
    return new Date(order.createdAt || order.orderDate || '').toDateString() === today;
  }).length;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <PageHeader
        title="الطلبات"
        description="إدارة ومتابعة طلبات العملاء وحالات الشحن."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={refreshing}
          aria-label="تحديث قائمة الطلبات"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          تحديث
        </Button>
      </PageHeader>

      {error ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center"
        >
          <AlertCircle className="size-6 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={refreshing}>
            إعادة المحاولة
          </Button>
        </div>
      ) : null}

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        <StatCard
          title="إيرادات الصفحة"
          loading={loading}
          footnote={`من ${pagination.total.toLocaleString()} طلب${
            selectedStatus !== 'all' ? ` بالحالة المحددة` : ''
          }`}
        >
          {Object.entries(revenueByCurrency).length === 0 ? (
            <div className="text-3xl font-bold tracking-tight text-foreground">—</div>
          ) : (
            Object.entries(revenueByCurrency)
              .sort(([, a], [, b]) => b - a)
              .map(([code, total]) => (
                <div key={code} className="text-2xl font-bold tracking-tight text-foreground">
                  {formatMoney(total, code)}
                </div>
              ))
          )}
        </StatCard>

        <StatCard
          title="طلبات تحتاج معالجة"
          loading={loading}
          footnote="قيد الانتظار والمعالجة — في هذه الصفحة"
        >
          <div className="text-3xl font-bold tracking-tight text-foreground">{pendingOrders}</div>
        </StatCard>

        <StatCard title="طلبات اليوم" loading={loading} footnote="في هذه الصفحة">
          <div className="text-3xl font-bold tracking-tight text-foreground">{todaysOrders}</div>
        </StatCard>
      </div>

      <div className="space-y-4">
        {/* Status filter pills. Only the active tab carries a count: the backend
            has no per-status stats endpoint (see orders.route.js:42), so a count
            on an inactive tab could only be derived from the rows currently
            loaded — a wrong number is worse than none. */}
        {/* `aria-pressed` toggle buttons, not a tablist: there are no tab
            panels here — each pill re-queries the same table. */}
        <div
          role="group"
          aria-label="تصفية الطلبات حسب الحالة"
          className="flex flex-wrap gap-2"
        >
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.value;
            return (
              <Button
                key={tab.value}
                aria-pressed={isActive}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(tab.value)}
                className={cn(
                  "h-8 border px-4 text-xs",
                  isActive
                    ? "shadow-sm"
                    : "border-dashed border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {isActive && !loading ? (
                  <Badge
                    variant="secondary"
                    className="pointer-events-none ms-1 h-4 min-w-4 rounded-full bg-primary-foreground/20 px-1 text-[10px] text-primary-foreground"
                  >
                    {pagination.total}
                  </Badge>
                ) : null}
              </Button>
            );
          })}
        </div>

        <DataTable
          orders={orders}
          onRefresh={fetchOrders}
          pagination={pagination}
          onPageChange={setPage}
          isLoading={loading}
          isRefreshing={refreshing && !loading}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  footnote,
  loading,
  children,
}: {
  title: string;
  footnote?: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </>
        ) : (
          <>
            <div className="space-y-1">{children}</div>
            {footnote ? <p className="mt-1 text-xs text-muted-foreground">{footnote}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
