"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/useCart";
import { Button } from "@/components/ui/button";
import { IconTrash, IconMinus, IconPlus, IconArrowLeft } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { resolvePrice } from "@/lib/pricing";
import { useUser } from "@clerk/nextjs";

export default function CartPage() {
   const { items, removeItem, updateQuantity, getSubtotal } = useCart();
   const subtotal = getSubtotal();
   const { user, isLoaded } = useUser();

   if (items.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center">
               <IconTrash className="w-10 h-10 text-zinc-300" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">سلة التسوق فارغة</h2>
            <p className="text-zinc-500 max-w-md">لم تقم بإضافة أي منتجات للسلة بعد. تصفح المتجر واكتشف أفضل العروض.</p>
            <Link href="/shop">
               <Button size="lg" className="rounded-full px-8">
                  تصفح المنتجات
               </Button>
            </Link>
         </div>
      );
   }

   return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-20">
         {/* Cart Items */}
         <div className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl font-bold text-zinc-900 mb-6">سلة التسوق ({items.length})</h1>

            <div className="space-y-4">
               {items.map((item) => {
                  // Resolve price using the centralized logic to match backend/order creation
                  let selectedVariant;
                  if (item.product.variants && item.attributes) {
                     selectedVariant = item.product.variants.find(v =>
                        Object.entries(item.attributes || {}).every(([key, val]) => v.attributes?.[key] === val)
                     );
                  }

                  const { final } = resolvePrice({
                     product: item.product,
                     selectedVariant
                  });

                  const price = final;

                  return (
                     <div key={item._id} className="flex gap-4 p-4 bg-white rounded-xl border border-zinc-100 shadow-sm">
                        {/* Image */}
                        <div className="relative w-24 h-24 bg-zinc-50 rounded-lg overflow-hidden flex-shrink-0">
                           {item.product.images?.[0] && (
                              <Image
                                 src={item.product.images[0]}
                                 alt={item.product.name}
                                 fill
                                 className="object-cover"
                              />
                           )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between">
                           <div className="flex justify-between items-start">
                              <div>
                                 <h3 className="font-semibold text-zinc-900 line-clamp-1">{item.product.name}</h3>
                                 {/* Variants */}
                                 <div className="text-sm text-zinc-500 flex gap-2 mt-1">
                                    {Object.entries(item.attributes || {}).map(([key, val]) => (
                                       <span key={key} className="bg-zinc-50 px-2 py-0.5 rounded text-xs border border-zinc-100">
                                          {val}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                              <button
                                 onClick={() => removeItem(item.product._id, item.size, item.attributes)}
                                 className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                              >
                                 <IconTrash className="w-5 h-5" />
                              </button>
                           </div>

                           <div className="flex justify-between items-end mt-2">
                              <div className="font-bold text-lg text-zinc-900">
                                 {(price * item.quantity).toLocaleString()} <span className="text-xs font-normal text-zinc-500">ج.س</span>
                              </div>

                              {/* Quantity Control */}
                              <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 h-8">
                                 <button
                                    onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.size, item.attributes)}
                                    className="w-8 h-full flex items-center justify-center hover:bg-zinc-200 rounded-r-lg transition-colors"
                                 >
                                    <IconMinus className="w-3 h-3" />
                                 </button>
                                 <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                 <button
                                    onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.size, item.attributes)}
                                    className="w-8 h-full flex items-center justify-center hover:bg-zinc-200 rounded-l-lg transition-colors"
                                 >
                                    <IconPlus className="w-3 h-3" />
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Summary */}
         <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm sticky top-24">
               <h3 className="font-bold text-lg text-zinc-900 mb-4">ملخص الطلب</h3>

               <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-zinc-600">
                     <span>المجموع الفرعي</span>
                     <span>{subtotal.toLocaleString()} ج.س</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                     <span>التوصيل</span>
                     <span>يحدد عند الدفع</span>
                  </div>
               </div>

               <Separator className="my-4" />

               <div className="flex justify-between font-bold text-lg text-zinc-900 mb-6">
                  <span>الإجمالي التقديري</span>
                  <span>{subtotal.toLocaleString()} ج.س</span>
               </div>


               {isLoaded && !user ? (
                  <div className="space-y-3">
                     <Link href="/sign-in?redirect_url=/shop/checkout" className="block">
                        <Button className="w-full cursor-pointer text-white rounded-xl py-6 text-base bg-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-900/10">
                           تسجيل الدخول لإتمام الطلب
                           <IconArrowLeft className="mr-2 w-5 h-5" />
                        </Button>
                     </Link>
                     <p className="text-center text-xs text-zinc-500">
                        يجب تسجيل الدخول للمتابعة
                     </p>
                  </div>
               ) : (
                  <Link href="/shop/checkout" className="block">
                     <Button className="w-full cursor-pointer text-white rounded-xl py-6 text-base bg-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-900/10">
                        متابعة الدفع
                        <IconArrowLeft className="mr-2 w-5 h-5" />
                     </Button>
                  </Link>
               )}

               <div className="mt-4 text-xs text-center text-zinc-400">
                  تطبق الشروط والأحكام وسياسة الخصوصية
                  <Link href="/terms" className="text-zinc-500 cursor-pointer hover:text-zinc-900"> الشروط والأحكام </Link>
                  <Link href="/privacy" className="text-zinc-500 cursor-pointer hover:text-zinc-900">سياسة الخصوصية </Link>
               </div>
            </div>
         </div>
      </div>
   );
}
