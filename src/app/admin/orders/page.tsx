"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "./ordersTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Order, getOrderTotal, getOrderCurrency, formatMoney } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderStatus = 'all' | 'PENDING' | 'AWAITING_PAYMENT_CONFIRMATION' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED';

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


export default function Page() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [page, setPage] = useState(1);

  // Server-side pagination. The backend caps `limit` at 100 and accepts an
  // optional `status` filter; we forward both. Tab counts reflect the
  // filtered total (`meta.pagination.total` from the response).
  const fetchOrders = useCallback(async () => {
    setError(null);
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
    }
  }, [page, selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to page 1 when the user changes the status filter.
  useEffect(() => {
    setPage(1);
  }, [selectedStatus]);

  // Per-tab counts: only the active tab's count is server-truthful. Other
  // tabs are best-effort from the current page payload — a real admin
  // stats endpoint (commented out at backend orders.route.js:42) would
  // let us show accurate per-status totals here.
  const getStatusCount = (status: OrderStatus) => {
    if (status === selectedStatus) return pagination.total;
    if (status === 'all' && selectedStatus === 'all') return pagination.total;
    return orders.filter(order => order.status === status).length;
  };

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

  const statusTabs = [
    { value: 'all' as OrderStatus, label: 'الكل' },
    { value: 'PENDING' as OrderStatus, label: 'قيد الانتظار' },
    { value: 'AWAITING_PAYMENT_CONFIRMATION' as OrderStatus, label: 'انتظار الدفع' },
    { value: 'CONFIRMED' as OrderStatus, label: 'مؤكد' },
    { value: 'PROCESSING' as OrderStatus, label: 'قيد المعالجة' },
    { value: 'SHIPPED' as OrderStatus, label: 'تم الشحن' },
    { value: 'DELIVERED' as OrderStatus, label: 'تم التسليم' },
    { value: 'CANCELLED' as OrderStatus, label: 'ملغي' },
    { value: 'PAYMENT_FAILED' as OrderStatus, label: 'فشل الدفع' },
  ];

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-72 bg-muted/60 animate-pulse rounded" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="border rounded-md">
          <div className="h-12 bg-muted/40 animate-pulse rounded-t" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 border-t bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-6 py-8">
        <div className="border border-destructive/40 bg-destructive/5 rounded-lg p-6 text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchOrders(); }}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="الطلبات" 
        description="إدارة ومتابعة طلبات العملاء وحالات الشحن."
      />

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إيرادات الصفحة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
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
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              من {pagination.total.toLocaleString()} طلب{selectedStatus !== 'all' ? ` بحالة "${selectedStatus}"` : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات تحتاج معالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">قيد الانتظار والمعالجة</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {todaysOrders}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Status Filter Tabs - Pill Design */}
        <div className="flex flex-wrap gap-2 pb-2">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.value;
            return (
              <Button
                key={tab.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(tab.value)}
                className={`text-xs h-8 px-4 border ${isActive ? 'shadow-sm' : 'border-dashed border-border/60 text-muted-foreground hover:text-foreground'}`}
              >
                {tab.label}
                <Badge 
                  variant="secondary" 
                  className={`ml-2 h-4 min-w-4 px-1 text-[10px] rounded-full pointer-events-none ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {getStatusCount(tab.value)}
                </Badge>
              </Button>
            );
          })}
        </div>

        <DataTable
          orders={orders}
          onRefresh={fetchOrders}
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
