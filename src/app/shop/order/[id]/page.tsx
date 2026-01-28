"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { shopApi } from "@/lib/api";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconArrowRight, IconMapPin, IconPhone, IconCreditCard, IconBox } from "@tabler/icons-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

// Reusing status helpers
const getStatusColor = (status: string) => {
  switch (status) {
    case "PLACED":
    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "PAID":
    case "VERIFIED":
      return "bg-green-100 text-green-700 border-green-200";
    case "SHIPPED":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "DELIVERED":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PLACED: "تم الطلب",
    PENDING: "قيد المراجعة",
    PAID: "تم الدفع",
    VERIFIED: "مؤكد",
    SHIPPED: "تم الشحن",
    DELIVERED: "تم التوصيل",
    REJECTED: "مرفوض",
    CANCELLED: "ملغي",
  };
  return labels[status] || status;
};

export default function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["shop", "order", params.id],
    queryFn: () => shopApi.getOrder(params.id),
  });

  if (isLoading) return <div className="container py-12"><LoadingSkeleton /></div>;
  if (isError || !order) return (
     <div className="container py-20 text-center">
       <h2 className="text-2xl font-bold">الطلب غير موجود</h2>
     </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Header / Back Link */}
      <div className="mb-8">
         <Link href="/shop/orders" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-4">
            <IconArrowRight className="w-4 h-4" />
            العودة للطلبات
         </Link>
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-zinc-900">
               طلب #{order._id?.slice(-6).toUpperCase()}
            </h1>
            <Badge variant="outline" className={`rounded-full px-4 py-1 self-start md:self-auto ${getStatusColor(order.status)}`}>
               {getStatusLabel(order.status)}
            </Badge>
         </div>
         {order.createdAt && (
            <p className="text-zinc-500 mt-2">
               تم الطلب بتاريخ {new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         
         {/* Main Content: Items */}
         <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
               <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <IconBox className="w-5 h-5 text-zinc-400" />
                  المنتجات
               </h2>
               <div className="space-y-6">
                  {order.items?.map((item: any, idx: number) => (
                     <div key={idx} className="flex gap-4">
                        <div className="relative w-16 h-16 bg-zinc-50 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100">
                           {item.image ? (
                              <Image 
                                 src={item.image} 
                                 alt={item.name} 
                                 fill 
                                 className="object-cover"
                              />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">No Img</div>
                           )}
                        </div>
                        <div className="flex-1">
                           <h4 className="font-medium text-zinc-900 line-clamp-1">{item.name}</h4>
                           <div className="text-sm text-zinc-500 mb-1">
                              {item.quantity} × {item.price.toLocaleString()} ج.س
                           </div>
                           {item.attributes && (
                              <div className="flex gap-2">
                                 {Object.values(item.attributes).map((attr: any, i: number) => (
                                    <span key={i} className="text-xs bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100 text-zinc-600">
                                       {attr}
                                    </span>
                                 ))}
                              </div>
                           )}
                        </div>
                        <div className="font-semibold text-zinc-900">
                           {(item.price * item.quantity).toLocaleString()}
                        </div>
                     </div>
                  ))}
               </div>
               
               <Separator className="my-6" />
               
               <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-600">
                     <span>المجموع الفرعي</span>
                     <span>{order.subtotal?.toLocaleString() || 0} ج.س</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                     <span>التوصيل</span>
                     <span>{order.shippingFee?.toLocaleString() || 0} ج.س</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-zinc-900 pt-2">
                     <span>الإجمالي</span>
                     <span>{order.total?.toLocaleString() || 0} ج.س</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar: Info */}
         <div className="space-y-6">
            
            {/* Delivery Info */}
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
               <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <IconMapPin className="w-5 h-5 text-zinc-400" />
                  عنوان التوصيل
               </h2>
               <div className="text-sm text-zinc-600 space-y-1">
                  <p className="font-medium text-zinc-900">{order.address?.name}</p>
                  <p>{order.address?.city}, {order.address?.area}</p>
                  <p>{order.address?.street}</p>
                  {order.address?.building && <p>{order.address?.building}</p>}
               </div>
               <div className="mt-4 pt-4 border-t border-zinc-50">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                     <IconPhone className="w-4 h-4" />
                     <span className="dir-ltr">{order.address?.phone}</span>
                  </div>
               </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
               <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <IconCreditCard className="w-5 h-5 text-zinc-400" />
                  تفاصيل الدفع
               </h2>
               <div>
                  <p className="font-medium text-zinc-900 mb-1">
                     {order.paymentMethod === 'CASH' ? 'الدفع عند الاستلام' : 'تحويل بنكي (بنكك)'}
                  </p>
                  <Badge variant="secondary" className={`rounded-full text-xs font-normal ${order.paymentStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                     {order.paymentStatus === 'VERIFIED' ? 'تم الدفع' : 'في انتظار الدفع'}
                  </Badge>
               </div>
            </div>

            <Link href="/shop">
               <Button variant="outline" className="w-full rounded-xl h-12 border-zinc-200">
                  مواصلة التسوق
               </Button>
            </Link>

         </div>
      </div>
    </div>
  );
}
