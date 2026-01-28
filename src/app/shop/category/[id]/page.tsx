"use client";

import { shopApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductDTO } from "@/types/shop";

export default function CategoryProductsPage() {
  const params = useParams();
  const categoryId = params.id as string;

  const { data: category, isLoading: isCategoryLoading } = useQuery({
    queryKey: ["shop-category", categoryId],
    queryFn: () => shopApi.getCategory(categoryId),
    enabled: !!categoryId,
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["shop-category-products", categoryId],
    queryFn: () => shopApi.getProducts({ category: categoryId }), // Assuming backend filters by category query param
    enabled: !!categoryId,
  });

  const products = productsData?.data || [];
  const isLoading = isCategoryLoading || isProductsLoading;

  if (isLoading) {
    return (
       <div className="space-y-8">
          <div className="h-48 w-full bg-zinc-100 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-zinc-100 rounded-3xl animate-pulse" />
             ))}
          </div>
       </div>
    );
  }

  if (!category) {
     return <div className="p-12 text-center text-zinc-500">التصنيف غير موجود</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header / Banner */}
      {/* Header / Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-zinc-100 shadow-sm py-16 px-8 flex flex-col items-center text-center">
         <div className="absolute inset-0 bg-white" />
         
         <div className="relative z-10 space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">{category.name}</h1>
            {category.description && (
               <p className="text-lg text-zinc-600 max-w-2xl font-medium">{category.description}</p>
            )}
         </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900">المنتجات ({products.length})</h2>
            {/* Future: Filters could go here */}
         </div>

         {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
               {products.map((product: ProductDTO) => (
                  <ProductCard key={product._id} product={product} />
               ))}
            </div>
         ) : (
            <div className="py-24 text-center bg-zinc-50 rounded-3xl border border-zinc-100">
               <p className="text-zinc-500 text-lg">لا توجد منتجات في هذا التصنيف حالياً.</p>
            </div>
         )}
      </div>
    </div>
  );
}
