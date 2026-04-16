"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { axiosInstance } from "@/lib/axiosInstance";
import { SimpleOrdersTable } from "./simpleTable";
import OrdersTable, { DataTable } from "./ordersTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Order } from "./types";
import { getOrderTotal } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderStatus = 'all' | 'PENDING' | 'AWAITING_PAYMENT_CONFIRMATION' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED';




export default function Page() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const params = selectedStatus !== 'all' ? { status: selectedStatus } : {};
        const response = await axiosInstance.get("/orders/admin", {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        setOrders(response.data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [getToken, selectedStatus]);

  const getStatusCount = (status: OrderStatus) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  // Analytics calculations
  const totalRevenue = orders.reduce((sum, order) => sum + (getOrderTotal(order) || 0), 0);
  const pendingOrders = orders.filter(order => ['PENDING', 'AWAITING_PAYMENT_CONFIRMATION', 'pending'].includes(order.status || '')).length;
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
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-sm text-muted-foreground animate-pulse">جاري التحميل...</div>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              ${totalRevenue.toFixed(2)}
            </div>
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

        <DataTable orders={orders} />
      </div>
    </div>
  );
}
