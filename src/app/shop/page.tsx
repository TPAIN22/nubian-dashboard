"use client";

import { useQuery } from "@tanstack/react-query";
import { shopApi } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton"; // Reusing existing skeleton if compatible, or new one

export default function ShopIndexPage() {
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["shop", "products"],
    queryFn: () => shopApi.getProducts(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
         <div className="h-40 w-full bg-zinc-100 rounded-2xl animate-pulse" />
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
               <div key={i} className="aspect-square bg-zinc-100 rounded-2xl animate-pulse" />
            ))}
         </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
         <h2 className="text-2xl font-bold text-zinc-900">حدث خطأ أثناء تحميل المنتجات</h2>
         <p className="text-zinc-500">يرجى المحاولة مرة أخرى لاحقاً</p>
         <Button onClick={() => window.location.reload()} variant="outline">
            تحديث الصفحة
         </Button>
      </div>
    );
  }

  const items = Array.isArray(products) ? products : (products as any)?.data || [];

  return (
    <div className="space-y-8">
      {/* Banner / Header */}
      {/* Banner / Header */}
      {/* Banner / Header */}
      {/* Products Grid */}
      <section>
        {items.length === 0 ? (
           <div className="text-center py-20">
              <p className="text-zinc-500 text-lg">لا توجد منتجات حالياً.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
