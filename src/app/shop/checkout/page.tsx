"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/useCart";
import { shopApi } from "@/lib/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { AddressSelector } from "@/components/shop/AddressSelector";
import { uploadImageToImageKit } from "@/lib/upload";
import { IconCreditCard, IconCash, IconLoader2, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { CreateOrderRequest, PaymentMethod } from "@/types/shop";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { resolvePrice } from "@/lib/pricing";

export default function CheckoutPage() {
   const router = useRouter();
   const { user, isLoaded } = useUser();
   const { items, getSubtotal, clearCart } = useCart();
   const [loading, setLoading] = useState(false);
   const [uploading, setUploading] = useState(false);

   // State
   const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
   const [selectedAddress, setSelectedAddress] = useState<any>(null);
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
   const [transferProofUrl, setTransferProofUrl] = useState<string | null>(null);

   // Helper to construct address string
   const buildAddressString = (addr: any) => {
      if (!addr) return "";
      return [addr.city, addr.area, addr.street, addr.building, addr.notes].filter(Boolean).join(" - ");
   };

   // Helper to resolve variant and price for an item
   const resolveItemDetails = (item: any) => {
      let selectedVariant;
      if (item.product.variants && item.attributes) {
         selectedVariant = item.product.variants.find((v: any) =>
            Object.entries(item.attributes || {}).every(([key, val]) => v.attributes?.[key] === val)
         );
      }

      const { final } = resolvePrice({
         product: item.product,
         selectedVariant
      });

      return { selectedVariant, price: final };
   };

   // Handle Image Upload
   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
         setUploading(true);
         const url = await uploadImageToImageKit(file);
         setTransferProofUrl(url);
         toast.success("تم رفع الإيصال بنجاح");
      } catch (err) {
         toast.error("فشل رفع الصورة. حاول مرة أخرى");
         console.error(err);
      } finally {
         setUploading(false);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedAddressId || !selectedAddress) {
         return toast.error("يرجى اختيار عنوان التوصيل");
      }

      if (paymentMethod === "BANKAK" && !transferProofUrl) {
         return toast.error("يرجى إرفاق صورة إشعار التحويل");
      }

      setLoading(true);

      try {
         // Construct Payload per Backend Requirements
         const payload: any = {
            addressId: selectedAddressId, // REQUIRED
            shippingAddress: buildAddressString(selectedAddress), // Helper for older controllers
            phoneNumber: selectedAddress.phone,
            paymentMethod,
            items: items.map(item => {
               const { selectedVariant } = resolveItemDetails(item);
               return {
                  productId: item.product._id,
                  quantity: item.quantity,
                  size: item.size,
                  attributes: item.attributes,
                  variantId: selectedVariant?._id // Send variantId explicitly to help backend
               };
            }),
            // Bankak Proof
            transferProof: paymentMethod === "BANKAK" ? transferProofUrl : undefined
         };

         const order = await shopApi.createOrder(payload);

         toast.success("تم استلام طلبك بنجاح!");
         clearCart();
         router.push(`/shop/orders/${order._id}`);
      } catch (error: any) {
         console.error(error);
         const msg = error?.response?.data?.message || "حدث خطأ أثناء إنشاء الطلب.";
         toast.error(msg);
      } finally {
         setLoading(false);
      }
   };

   if (items.length === 0) {
      if (typeof window !== 'undefined') router.push('/shop');
      return null;
   }

   // Calculate realtime total for display
   const calculateTotal = () => {
      return items.reduce((acc, item) => {
         const { price } = resolveItemDetails(item);
         return acc + (price * item.quantity);
      }, 0);
   };

   const totalAmount = calculateTotal();

   return (
      <div className="pb-20">
         <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-zinc-900">إتمام الطلب</h1>
            <p className="text-zinc-500 mt-2">أكمل بياناتك لاستلام طلبك بأسرع وقت</p>
         </div>

         <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">

            {/* Right Column: Form (Main Content) */}
            <div className="lg:col-span-8 space-y-8">
               {/* Step 1: Shipping Info (Address Book) */}
               <section className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-zinc-900/20">1</div>
                     <h2 className="text-xl font-bold text-zinc-900">بيانات التوصيل</h2>
                  </div>

                  <AddressSelector
                     selectedId={selectedAddressId}
                     onSelect={(id, addr) => {
                        setSelectedAddressId(id);
                        setSelectedAddress(addr);
                     }}
                  />
               </section>

               {/* Step 2: Payment */}
               <section className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-zinc-900/20">2</div>
                     <h2 className="text-xl font-bold text-zinc-900">طريقة الدفع</h2>
                  </div>

                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className={`relative border-2 rounded-2xl p-4 cursor-pointer hover:bg-zinc-50 transition-all duration-300 ${paymentMethod === 'CASH' ? 'border-amber-500 bg-amber-50/10' : 'border-zinc-100'}`}>
                        <RadioGroupItem value="CASH" id="cash" className="sr-only" />
                        <Label htmlFor="cash" className="flex items-center gap-4 cursor-pointer w-full h-full">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === 'CASH' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-400'}`}>
                              <IconCash className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="font-bold text-zinc-900 text-lg">كاش</div>
                              <div className="text-sm text-zinc-500">الدفع عند الاستلام</div>
                           </div>
                           {paymentMethod === 'CASH' && (
                              <div className="mr-auto w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white">
                                 <IconCheck className="w-4 h-4" />
                              </div>
                           )}
                        </Label>
                     </div>

                     <div className={`relative border-2 rounded-2xl p-4 cursor-pointer hover:bg-zinc-50 transition-all duration-300 ${paymentMethod === 'BANKAK' ? 'border-amber-500 bg-amber-50/10' : 'border-zinc-100'}`}>
                        <RadioGroupItem value="BANKAK" id="bankak" className="sr-only" />
                        <Label htmlFor="bankak" className="flex items-center gap-4 cursor-pointer w-full h-full">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === 'BANKAK' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-400'}`}>
                              <IconCreditCard className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="font-bold text-zinc-900 text-lg">بنكك</div>
                              <div className="text-sm text-zinc-500">تحويل بنكي</div>
                           </div>
                           {paymentMethod === 'BANKAK' && (
                              <div className="mr-auto w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white">
                                 <IconCheck className="w-4 h-4" />
                              </div>
                           )}
                        </Label>
                     </div>
                  </RadioGroup>

                  {/* Bankak Details & Upload */}
                  {paymentMethod === 'BANKAK' && (
                     <div className="mt-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-200 animate-in fade-in slide-in-from-top-4">
                        <div className="space-y-2 mb-6 text-sm text-zinc-600">
                           <div className="flex justify-between border-b pb-2 border-zinc-200">
                              <span>رقم الحساب</span>
                              <span className="font-mono font-bold text-zinc-900 text-lg">2449230</span>
                           </div>
                           <div className="flex justify-between border-b pb-2 border-zinc-200">
                              <span>اسم الحساب</span>
                              <span className="font-bold text-zinc-900"> سعيد عبدالجبار  </span>
                           </div>
                           <div className="flex justify-between">
                              <span>البنك</span>
                              <span className="font-bold text-zinc-900">بنك الخرطوم</span>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <Label className="text-zinc-900 font-bold">إرفاق إشعار التحويل</Label>

                           <div className="relative">
                              <Input
                                 type="file"
                                 accept="image/*"
                                 onChange={handleFileUpload}
                                 disabled={uploading}
                                 className="cursor-pointer file:cursor-pointer file:bg-zinc-900 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-1 file:mr-4 hover:file:bg-zinc-800"
                              />
                              {uploading && (
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <IconLoader2 className="w-5 h-5 animate-spin text-zinc-500" />
                                 </div>
                              )}
                           </div>

                           {transferProofUrl && (
                              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-200 bg-white">
                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                 <img src={transferProofUrl} alt="Transfer Proof" className="w-full h-full object-contain" />
                                 <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                    <IconCheck className="w-3 h-3" />
                                    تم الرفع
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </section>
            </div>

            {/* Left Column: Summary (Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 mt-8 lg:mt-0">
               <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50">
                  <h3 className="font-bold text-xl mb-6">ملخص الطلب</h3>

                  <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                     {items.map((item) => {
                        const { price } = resolveItemDetails(item);
                        return (
                           <div key={item.product._id + item.size} className="flex gap-4 items-start">
                              <div className="relative w-16 h-16 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                                 {item.product.images?.[0] && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                 )}
                                 <span className="absolute bottom-0 right-0 bg-zinc-900 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md font-bold">
                                    x{item.quantity}
                                 </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="font-medium text-sm text-zinc-900 line-clamp-2">{item.product.name}</p>
                                 <p className="text-xs text-zinc-500 mt-1">
                                    {price.toLocaleString()} ج.س
                                    {item.size && <span className="mr-2 px-1.5 bg-zinc-100 rounded text-[10px]">{item.size}</span>}
                                 </p>
                                 {item.attributes && Object.keys(item.attributes).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                       {Object.entries(item.attributes).map(([k, v]) => (
                                          <span key={k} className="text-[10px] bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100 text-zinc-500">
                                             {v}
                                          </span>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  <div className="border-t border-dashed border-zinc-200 pt-4 space-y-2">
                     <div className="flex justify-between text-zinc-500">
                        <span>المجموع الفرعي</span>
                        <span>{totalAmount.toLocaleString()} ج.س</span>
                     </div>
                     <div className="flex justify-between text-zinc-500">
                        <span>التوصيل</span>
                        <span className="text-green-600 font-medium">مجاني لفترة محدودة</span>
                     </div>
                     <div className="flex justify-between text-zinc-900 font-bold text-xl pt-2 border-t border-zinc-100 mt-2">
                        <span>الإجمالي</span>
                        <span>{totalAmount.toLocaleString()} ج.س</span>
                     </div>
                  </div>

                  <Button
                     type="submit"
                     onClick={handleSubmit}
                     disabled={loading || uploading || (paymentMethod === "BANKAK" && !transferProofUrl) || !selectedAddressId}
                     className="w-full h-14 mt-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-lg shadow-lg shadow-zinc-900/20 hover:shadow-zinc-900/40 transition-all hover:-translate-y-0.5"
                  >
                     {loading ? <IconLoader2 className="w-6 h-6 animate-spin" /> : "تأكيد الطلب"}
                  </Button>

                  <p className="text-center text-xs text-zinc-400 mt-4 leading-relaxed">
                     عند تأكيد الطلب، فإنك توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة نوبيان.
                  </p>
               </div>
            </div>

         </form>
      </div>
   );
}
