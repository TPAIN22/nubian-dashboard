"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { shopApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconPackage,
  IconChevronDown,
  IconChevronUp,
  IconMapPin,
  IconPhone,
  IconCreditCard,
  IconTruckDelivery,
  IconCalendar,
  IconTicket
} from "@tabler/icons-react";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Helper for status colors (matching mobile app)
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-amber-500 text-white border-amber-500";
    case "confirmed":
      return "bg-emerald-600 text-white border-emerald-600";
    case "shipped":
      return "bg-blue-500 text-white border-blue-500";
    case "delivered":
      return "bg-green-500 text-white border-green-500";
    case "cancelled":
    case "rejected":
      return "bg-red-500 text-white border-red-500";
    default:
      return "bg-zinc-400 text-white border-zinc-400";
  }
};

const getStatusText = (status: string) => {
  const labels: Record<string, string> = {
    pending: "قيد المراجعة",
    placed: "تم الطلب",
    confirmed: "تم التأكيد",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    rejected: "مرفوض",
    cancelled: "ملغي",
  };
  return labels[status?.toLowerCase()] || status;
};

const getPaymentStatusText = (status: string) => {
  const labels: Record<string, string> = {
    pending: "قيد الانتظار",
    paid: "تم الدفع",
    failed: "فشلت العملية",
    awaiting_verification: "بانتظار التحقق"
  };
  return labels[status?.toLowerCase()] || status;
};

const getPaymentMethodText = (method: string) => {
  const labels: Record<string, string> = {
    cash: "دفع عند الاستلام",
    card: "بطاقة بنكية",
    bankak: "بنكك"
  };
  return labels[method?.toLowerCase()] || method;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US').format(price) + ' ج.س';
};

export default function OrdersPage() {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["shop", "orders"],
    queryFn: () => shopApi.getOrders(),
  });

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (isLoading) return <div className="container py-12"><LoadingSkeleton /></div>;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900">حدث خطأ أثناء تحميل الطلبات</h2>
        <Button onClick={() => window.location.reload()} variant="outline">
          حاول مرة أخرى
        </Button>
      </div>
    );
  }

  const items = Array.isArray(orders) ? orders : (orders as any)?.data || [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center">
          <IconPackage className="w-10 h-10 text-zinc-300" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900">لا توجد طلبات سابقة</h2>
        <p className="text-zinc-500 max-w-md">لم تقم بإجراء أي عمليات شراء حتى الآن.</p>
        <Link href="/shop">
          <Button size="lg" className="rounded-full px-8 bg-black hover:bg-zinc-800 text-white">
            ابدأ التسوق
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4">
      <h1 className="text-3xl font-bold text-zinc-900 mb-2 mt-8 text-center">طلباتي</h1>
      <p className="text-zinc-500 text-center mb-8">({items.length}) طلبات سابقة</p>

      <div className="space-y-6">
        {items.map((order: any) => {
          const isExpanded = expandedOrders[order._id];
          const productsCount = order.productsDetails?.reduce((acc: number, p: any) => acc + (p.quantity || 1), 0) || order.items?.length || 0;

          return (
            <div
              key={order._id}
              className="bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div
                className="p-5 cursor-pointer border-b border-zinc-50"
                onClick={() => toggleOrderExpansion(order._id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-xl text-zinc-900 font-mono">
                        #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", getStatusColor(order.status))}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-black hover:bg-zinc-50 gap-1 text-xs"
                  >
                    {isExpanded ? (
                      <>إخفاء التفاصيل <IconChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>عرض التفاصيل <IconChevronDown className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>

                {/* Quick Actions (Tracking) */}
                <div className="flex justify-end mb-4">
                  <Link href={`/shop/order/${order._id}`}>
                    <Button variant="outline" size="sm" className="h-8 gap-2 text-xs rounded-full border-zinc-200 text-zinc-600 hover:text-black hover:border-black">
                      <IconTruckDelivery className="w-3.5 h-3.5" />
                      تتبع الطلب
                    </Button>
                  </Link>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
                      <IconCalendar className="w-3 h-3" /> التاريخ
                    </div>
                    <div className="text-sm font-medium text-zinc-700">
                      {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
                      <IconPackage className="w-3 h-3" /> المنتجات
                    </div>
                    <div className="text-sm font-medium text-zinc-700">
                      {productsCount} منتج
                    </div>
                  </div>
                </div>

                {/* Coupon Section */}
                {order.couponDetails?.code && (
                  <div className="mt-4 pt-3 border-t border-dashed border-zinc-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <IconTicket className="w-4 h-4 text-amber-500" />
                        <span>كوبون: <span className="font-mono font-bold text-amber-600">{order.couponDetails.code}</span></span>
                      </div>
                      {order.discountAmount > 0 && (
                        <span className="text-sm font-bold text-green-600">
                          خصم {formatPrice(order.discountAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Total Section */}
                <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-base font-bold text-zinc-600">المجموع الكلي</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-zinc-900">{formatPrice(order.finalAmount || order.totalAmount || order.total)}</div>
                    {order.discountAmount > 0 && (
                      <div className="text-xs text-zinc-400 line-through">
                        {formatPrice(order.totalAmount || (order.total + order.discountAmount))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="bg-zinc-50/50 p-5 border-t border-zinc-100 animate-in slide-in-from-top-2 duration-200">

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Delivery Info */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-zinc-900 flex items-center gap-2 text-sm">
                        <IconMapPin className="w-4 h-4 text-black" /> معلومات التوصيل
                      </h4>
                      <div className="bg-white p-3 rounded-xl border border-zinc-100 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">المدينة</span>
                          <span className="font-medium text-zinc-900">{order.address?.city || order.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">العنوان</span>
                          <span className="font-medium text-zinc-900">{order.address?.street || order.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">رقم الهاتف</span>
                          <span className="font-mono text-zinc-900 dir-ltr">{order.address?.phone || order.phoneNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-zinc-900 flex items-center gap-2 text-sm">
                        <IconCreditCard className="w-4 h-4 text-black" /> تفاصيل الدفع
                      </h4>
                      <div className="bg-white p-3 rounded-xl border border-zinc-100 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">طريقة الدفع</span>
                          <span className="font-medium text-zinc-900">{getPaymentMethodText(order.paymentMethod)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">حالة الدفع</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-bold",
                            order.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {getPaymentStatusText(order.paymentStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-zinc-900 flex items-center gap-2 text-sm">
                      <IconPackage className="w-4 h-4 text-black" /> المنتجات ({productsCount})
                    </h4>
                    <div className="space-y-2">
                      {(order.productsDetails || order.items)?.map((item: any, idx: number) => (
                        <Link
                          href={`/shop/product/${item.productId || item.product?._id || item._id}`}
                          key={idx}
                          className="flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-100 hover:border-black/20 transition-colors"
                        >
                          <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                            {(item.images?.[0] || item.product?.images?.[0]) ? (
                              <Image
                                src={item.images?.[0] || item.product?.images?.[0]}
                                alt={item.name || "Product"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                <IconPackage className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-zinc-900 text-sm truncate">
                              {item.name || item.product?.name || "منتج غير محدد"}
                            </h5>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {formatPrice(item.price || item.finalPrice)} × {item.quantity}
                            </p>
                          </div>

                          <div className="text-sm font-bold text-zinc-900">
                            {formatPrice((item.price || item.finalPrice) * item.quantity)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-xs text-zinc-400 italic">
                      آخر تحديث: {new Date(order.updatedAt).toLocaleDateString('ar-EG', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
