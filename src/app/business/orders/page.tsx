"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { axiosInstance } from "@/lib/axiosInstance";
import { SimpleOrdersTable } from "./simpleTable";
import OrdersTable, { DataTable } from "./ordersTable";
import { Order } from "./types";
import { getOrderTotal } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderStatus = 'all' | 'PENDING' | 'AWAITING_PAYMENT_CONFIRMATION' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED';

export const runtime = 'edge';


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
    { value: 'all' as OrderStatus, label: 'الكل', color: 'default' },
    { value: 'PENDING' as OrderStatus, label: 'قيد الانتظار', color: 'secondary' },
    { value: 'AWAITING_PAYMENT_CONFIRMATION' as OrderStatus, label: 'انتظار الدفع', color: 'yellow' },
    { value: 'CONFIRMED' as OrderStatus, label: 'مؤكد', color: 'default' },
    { value: 'PROCESSING' as OrderStatus, label: 'قيد المعالجة', color: 'blue' },
    { value: 'SHIPPED' as OrderStatus, label: 'تم الشحن', color: 'default' },
    { value: 'DELIVERED' as OrderStatus, label: 'تم التسليم', color: 'default' },
    { value: 'CANCELLED' as OrderStatus, label: 'ملغي', color: 'destructive' },
    { value: 'PAYMENT_FAILED' as OrderStatus, label: 'فشل الدفع', color: 'destructive' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold sm:mx-12 mx-2">الطلبات</h1>

      <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">من جميع الطلبات</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات تحتاج معالجة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingOrders}
              </div>
              <p className="text-xs text-muted-foreground">قيد الانتظار والمعالجة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {todaysOrders}
              </div>
              <p className="text-xs text-muted-foreground">طلبات اليوم</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <Button
              key={tab.value}
              variant={selectedStatus === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(tab.value)}
              className="text-xs"
            >
              {tab.label}
              <Badge variant={tab.color as any} className="ml-2 text-xs">
                {getStatusCount(tab.value)}
              </Badge>
            </Button>
          ))}
        </div>

        <DataTable orders={orders} />
      </div>
    </div>
  );
}