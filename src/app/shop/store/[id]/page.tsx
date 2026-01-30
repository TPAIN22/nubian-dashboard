"use client";

import { shopApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductDTO } from "@/types/shop";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconMapPin, IconPhone, IconMail, IconStarFilled, IconDiscountCheckFilled } from "@tabler/icons-react";

export default function StoreProfilePage() {
   const params = useParams();
   const storeId = params.id as string;

   const { data: store, isLoading: isStoreLoading } = useQuery({
      queryKey: ["shop-store", storeId],
      queryFn: () => shopApi.getStore(storeId),
      enabled: !!storeId,
   });

   const { data: productsData, isLoading: isProductsLoading } = useQuery({
      queryKey: ["shop-store-products", storeId],
      queryFn: () => shopApi.getStoreProducts(storeId),
      enabled: !!storeId,
   });

   const products = productsData?.data || [];
   const isLoading = isStoreLoading || isProductsLoading;

   if (isLoading) {
      return (
         <div className="space-y-8">
            <div className="h-48 md:h-64 w-full bg-zinc-100 rounded-2xl md:rounded-3xl animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 gap-y-6 md:gap-x-6 md:gap-y-10">
               {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] md:aspect-[4/5] bg-zinc-100 rounded-2xl md:rounded-3xl animate-pulse" />
               ))}
            </div>
         </div>
      );
   }

   if (!store) {
      return <div className="p-12 text-center text-zinc-500">المتجر غير موجود</div>;
   }

   return (
      <div className="space-y-12">
         {/* Store Header Info */}
         <div className="relative bg-white border border-zinc-100 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-lg shadow-zinc-100/50">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">

               <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-xl rounded-2xl">
                  {/* Assuming store has a logo, fallback needed if not in data */}
                  <AvatarImage src={store.logo} alt={store.businessName} />
                  <AvatarFallback className="bg-zinc-900 text-white text-4xl font-bold rounded-2xl">
                     {store.businessName.charAt(0)}
                  </AvatarFallback>
               </Avatar>

               <div className="flex-1 space-y-4 text-center md:text-right">
                  <div>
                     <h1 className="text-3xl md:text-5xl font-black text-zinc-900 flex items-center justify-center md:justify-start gap-3">
                        {store.businessName}
                        {store.verified && <IconDiscountCheckFilled className="w-8 h-8 text-blue-500" />}
                     </h1>
                     <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-amber-500 font-bold text-lg">
                        <IconStarFilled className="w-5 h-5" />
                        <span>{store.rating || 4.5}</span>
                        <span className="text-zinc-400 font-normal text-sm">(تقييم عام)</span>
                     </div>
                  </div>

                  <p className="text-lg text-zinc-600 max-w-2xl leading-relaxed">
                     {store.businessDescription || "متجر متخصص في بيع أجود المنتجات السودانية."}
                  </p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                     <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-full text-zinc-600 text-sm font-medium">
                        <IconMapPin className="w-4 h-4" />
                        {store.businessAddress?.city || "الخرطوم"}
                     </div>
                     {store.businessPhone && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-full text-zinc-600 text-sm font-medium">
                           <IconPhone className="w-4 h-4" />
                           {store.businessPhone}
                        </div>
                     )}
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="flex gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors">
                     مراسلة المتجر
                  </button>
               </div>
            </div>
         </div>

         {/* Products Grid */}
         <div className="space-y-6">
            <h2 className="text-2xl font-bold text-zinc-900 px-4 border-r-4 border-amber-500 bg-gradient-to-l from-zinc-50 to-transparent py-2 rounded-r-none rounded-l-xl">
               منتجات المتجر
            </h2>

            {products.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 gap-y-6 md:gap-x-6 md:gap-y-10">
                  {products.map((product: ProductDTO) => (
                     <ProductCard key={product._id} product={product} />
                  ))}
               </div>
            ) : (
               <div className="py-24 text-center bg-zinc-50 rounded-3xl border border-zinc-100">
                  <p className="text-zinc-500 text-lg">لم يقم هذا المتجر بإضافة منتجات بعد.</p>
               </div>
            )}
         </div>
      </div>
   );
}
