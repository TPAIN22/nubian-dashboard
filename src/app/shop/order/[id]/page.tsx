"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { shopApi } from "@/lib/api";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
   IconArrowRight,
   IconMapPin,
   IconPhone,
   IconCreditCard,
   IconBox,
   IconTruckDelivery,
   IconCheck,
   IconClock,
   IconX
} from "@tabler/icons-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// --- Status Helpers ---

const ORDER_STEPS = [
   { status: "PENDING", label: "بانتظار تاكيد طريقة الدفع", icon: IconClock },
   { status: "CONFIRMED", label: "تم التأكيد", icon: IconCheck },
   { status: "SHIPPED", label: "خرج للتوصيل", icon: IconTruckDelivery },
   { status: "DELIVERED", label: "تم التوصيل", icon: IconBox },
];

const getStepStatus = (currentStatus: string, stepStatus: string) => {
   const statusOrder = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

   // Normalize backend status to our steps
   let normalizedCurrent = currentStatus.toUpperCase();
   if (normalizedCurrent === "PLACED") normalizedCurrent = "PENDING";
   if (normalizedCurrent === "PAID") normalizedCurrent = "CONFIRMED";
   if (normalizedCurrent === "VERIFIED") normalizedCurrent = "CONFIRMED";
   if (normalizedCurrent === "PROCESSING") normalizedCurrent = "CONFIRMED";

   if (normalizedCurrent === "CANCELLED" || normalizedCurrent === "REJECTED") return "cancelled";

   const currentIndex = statusOrder.indexOf(normalizedCurrent);
   const stepIndex = statusOrder.indexOf(stepStatus);

   if (currentIndex === -1) return "waiting"; // Unknown status
   if (currentIndex >= stepIndex) return "completed";
   return "waiting";
};

export default function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
   const params = use(props.params);
   const { data: order, isLoading, isError } = useQuery({
      queryKey: ["shop", "order", params.id],
      queryFn: () => shopApi.getOrder(params.id),
   });

   if (isLoading) return <div className="container py-12"><LoadingSkeleton /></div>;
   if (isError || !order) return (
      <div className="container py-20 text-center space-y-4">
         <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
            <IconX className="w-8 h-8 text-zinc-400" />
         </div>
         <h2 className="text-2xl font-bold text-zinc-900">الطلب غير موجود</h2>
         <Link href="/shop/orders">
            <Button variant="outline">العودة للطلبات</Button>
         </Link>
      </div>
   );

   const isCancelled = ["CANCELLED", "REJECTED"].includes(order.status?.toUpperCase());

   return (
      <div className="max-w-5xl mx-auto pb-20 px-4 md:px-6">

         {/* Header / Back Link */}
         <div className="mb-8">
            <Link href="/shop/orders" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-6 transition-colors w-fit">
               <IconArrowRight className="w-4 h-4" />
               العودة للطلبات
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <h1 className="text-3xl font-bold text-zinc-900 font-mono">
                        #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                     </h1>
                     {isCancelled && (
                        <Badge variant="destructive" className="rounded-full px-3">ملغي</Badge>
                     )}
                  </div>
                  <p className="text-zinc-500 flex items-center gap-2 text-sm">
                     <IconClock className="w-4 h-4" />
                     {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                     }) : 'تاريخ غير متوفر'}
                  </p>
               </div>
            </div>
         </div>
         {/* Timeline Tracking */}
         {!isCancelled && (
            <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm mb-8 overflow-x-auto">
               <div className="min-w-[600px] flex justify-between relative">
                  {/* Progress Line Background */}
                  <div className="absolute top-5 left-0 w-full h-1 bg-zinc-100 rounded-full -z-10" />

                  {/* Steps */}
                  {ORDER_STEPS.map((step, idx) => {
                     const statusState = getStepStatus(order.status || "PENDING", step.status);
                     const isCompleted = statusState === "completed";
                     const StepIcon = step.icon;

                     return (
                        <div key={step.status} className="flex flex-col items-center gap-4 relative z-0 flex-1">
                           {/* Progress Line Active Segment (Pseudo-logic for visual only, hard to do strictly in map without complex logic) */}
                           {/* Connecting Line to next step */}
                           {idx < ORDER_STEPS.length - 1 && (
                              <div className={cn(
                                 "absolute top-5 right-[50%] w-full h-1 -z-10 transition-colors duration-500",
                                 getStepStatus(order.status || "PENDING", ORDER_STEPS[idx + 1].status) === "completed"
                                    ? "bg-amber-500"
                                    : "bg-zinc-100"
                              )} />
                           )}

                           <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                              isCompleted
                                 ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20"
                                 : "bg-white border-zinc-200 text-zinc-300"
                           )}>
                              <StepIcon className="w-5 h-5" />
                           </div>
                           <span className={cn(
                              "text-sm font-bold transition-colors duration-300",
                              isCompleted ? "text-zinc-900" : "text-zinc-400"
                           )}>
                              {step.label}
                           </span>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Content: Items */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white border border-zinc-100 rounded-3xl p-6 md:p-8 shadow-sm">
                  <h2 className="font-bold text-xl mb-6 flex items-center gap-2 text-zinc-900">
                     <IconBox className="w-6 h-6 text-amber-500" />
                     المنتجات ({order.productsDetails?.length || 0})
                  </h2>

                  <div className="space-y-6 divide-y divide-zinc-50">
                     {order.productsDetails?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4 pt-6 first:pt-0">
                           <div className="relative w-20 h-20 bg-zinc-50 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-100">
                              {item.images?.[0] ? (
                                 <Image
                                    src={item.images[0]}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                 />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                    <IconBox className="w-6 h-6" />
                                 </div>
                              )}
                              <span className="absolute bottom-0 right-0 bg-zinc-900 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md font-bold">
                                 x{item.quantity}
                              </span>
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-4">
                                 <h4 className="font-bold text-zinc-900 line-clamp-2 text-base">{item.name}</h4>
                                 <div className="font-bold text-zinc-900 whitespace-nowrap">
                                    {(item.totalPrice || (item.price * item.quantity)).toLocaleString()} <span className="text-xs font-normal text-zinc-500">ج.س</span>
                                 </div>
                              </div>

                              <div className="text-sm text-zinc-500 mt-1">
                                 {item.price?.toLocaleString()} ج.س / قطعة
                              </div>

                              {/* Attributes / Variants */}
                              {item.attributes && Object.keys(item.attributes).length > 0 && (
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    {Object.entries(item.attributes).map(([key, val]: any) => (
                                       <span key={key} className="text-xs bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100 text-zinc-600 font-medium">
                                          {val}
                                       </span>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>

                  <Separator className="my-8" />

                  {/* Order Summary */}
                  <div className="space-y-3">
                     <div className="flex justify-between text-zinc-600">
                        <span>المجموع الفرعي</span>
                        <span className="font-mono">{order.orderSummary?.subtotal?.toLocaleString() || order.totalAmount?.toLocaleString() || 0} ج.س</span>
                     </div>
                     <div className="flex justify-between text-zinc-600">
                        <span>الخصم</span>
                        <span className="font-mono text-red-600">
                           {order.orderSummary?.discount > 0 ? `-${order.orderSummary.discount.toLocaleString()}` : 0} ج.س
                        </span>
                     </div>
                     <div className="flex justify-between text-zinc-600">
                        <span>التوصيل</span>
                        <span className="text-green-600 font-medium">مجاني لفترة محدودة</span>
                     </div>

                     <div className="flex justify-between items-end pt-4 border-t border-zinc-100 mt-4">
                        <span className="font-bold text-xl text-zinc-900">الإجمالي</span>
                        <div className="text-right">
                           <span className="font-bold text-2xl text-zinc-900 font-mono">
                              {order.orderSummary?.total?.toLocaleString() || order.finalAmount?.toLocaleString() || 0}
                           </span>
                           <span className="text-sm text-zinc-500 mr-2">ج.س</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Sidebar: Info */}
            <div className="space-y-6">

               {/* Delivery Info */}
               <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-zinc-900">
                     <IconMapPin className="w-5 h-5 text-amber-500" />
                     عنوان التوصيل
                  </h2>

                  <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                     {/* Address Display Logic */}
                     {typeof order.address === 'string' ? (
                        <p className="text-zinc-700 leading-relaxed font-medium">
                           {order.address}
                        </p>
                     ) : (
                        // Fallback for object legacy
                        <div className="text-sm text-zinc-600 space-y-1">
                           <p className="font-bold text-zinc-900">{order.address?.name}</p>
                           <p>{order.address?.city} {order.address?.area ? ` - ${order.address?.area}` : ''}</p>
                           <p>{order.address?.street}</p>
                           {order.address?.building && <p>{order.address?.building}</p>}
                        </div>
                     )}

                     <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 flex items-center gap-2 text-zinc-600">
                        <IconPhone className="w-4 h-4" />
                        <span className="dir-ltr font-mono">{order.phoneNumber}</span>
                     </div>
                  </div>
               </div>

               {/* Payment Info */}
               <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-zinc-900">
                     <IconCreditCard className="w-5 h-5 text-amber-500" />
                     تفاصيل الدفع
                  </h2>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <span className="text-zinc-600 text-sm font-medium">طريقة الدفع</span>
                        <span className="font-bold text-zinc-900">
                           {order.paymentMethod === 'CASH' ? 'كاش (عند الاستلام)' : 'تحويل بنكي (بنكك)'}
                        </span>
                     </div>

                     <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <span className="text-zinc-600 text-sm font-medium">حالة الدفع</span>
                        <Badge variant="secondary" className={cn(
                           "rounded-full px-3",
                           order.paymentStatus === 'paid' || order.paymentStatus === 'VERIFIED'
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                        )}>
                           {order.paymentStatus === 'paid' || order.paymentStatus === 'VERIFIED' ? 'تم الدفع' : 'في انتظار الدفع'}
                        </Badge>
                     </div>

                     {order.transferProof && (
                        <div className="mt-4">
                           <p className="text-xs text-zinc-500 mb-2 font-medium">إيصال التحويل:</p>
                           <div className="relative w-full h-32 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200">
                              <Image src={order.transferProof} alt="Transfer Proof" fill className="object-cover" />
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               <Link href="/shop" className="block">
                  <Button variant="outline" className="w-full rounded-xl h-14 border-zinc-200 hover:bg-zinc-50 font-bold text-zinc-700">
                     مواصلة التسوق
                  </Button>
               </Link>

            </div>
         </div>
      </div>
   );
}
