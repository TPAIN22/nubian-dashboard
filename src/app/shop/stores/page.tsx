"use client";

import { shopApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { IconBuildingStore, IconStarFilled } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StoresPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["shop-stores"],
    queryFn: () => shopApi.getStores({ limit: 50 }),
  });

  if (isLoading) {
     return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
           {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-zinc-100 rounded-3xl animate-pulse" />
           ))}
        </div>
     );
  }

  if (error) {
     return <div className="p-8 text-center text-red-500">حدث خطأ أثناء تحميل المتاجر</div>;
  }

  const stores = data?.data || [];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">متاجرنا وشركاؤنا</h1>
        <p className="text-zinc-500">تسوق من أفضل المتاجر والعلامات التجارية السودانية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store: any) => (
          <Link
            key={store._id}
            href={`/shop/store/${store._id}`}
            className="group flex flex-col bg-white rounded-3xl border border-zinc-100 p-6 hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-zinc-50 shadow-sm">
                     <AvatarImage src={store.logo} alt={store.businessName} />
                     <AvatarFallback className="bg-zinc-100 text-zinc-400 font-bold text-xl">
                        {store.businessName.charAt(0)}
                     </AvatarFallback>
                  </Avatar>
                  <div>
                     <h3 className="font-bold text-lg text-zinc-900 group-hover:text-amber-700 transition-colors">
                        {store.businessName}
                     </h3>
                     <div className="flex items-center gap-1 text-amber-500 text-sm">
                        <IconStarFilled className="w-3.5 h-3.5" />
                        <span className="font-medium">{store.rating || '4.5'}</span>
                     </div>
                  </div>
               </div>
               <div className="p-2 bg-zinc-50 rounded-full group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                  <IconBuildingStore className="w-5 h-5 text-zinc-400 group-hover:text-amber-600" />
               </div>
            </div>
            
            <p className="text-zinc-500 text-sm line-clamp-2 mb-4 flex-1">
               {store.businessDescription || "متجر متميز يقدم أفضل المنتجات السودانية."}
            </p>

            <div className="w-full py-2.5 rounded-xl bg-zinc-50 text-zinc-600 text-center text-sm font-medium group-hover:bg-zinc-900 group-hover:text-white transition-colors">
               زيارة المتجر
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
