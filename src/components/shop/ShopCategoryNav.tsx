"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { shopApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export function ShopCategoryNav() {
  const pathname = usePathname();
  const { data: categories, isLoading } = useQuery({
    queryKey: ["shop-categories-nav"],
    queryFn: shopApi.getCategories,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading) {
    return (
      <div className="w-full border-b border-zinc-100 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-6 py-3 overflow-x-auto scrollbar-hide">
             {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-20 rounded-full bg-zinc-100 flex-shrink-0" />
             ))}
          </div>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <div className="w-full border-b border-zinc-100 bg-white z-30 relative">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
           <Link 
              href="/shop" 
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                pathname === "/shop" 
                  ? "bg-zinc-900 text-white" 
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
           >
              الكل
           </Link>
           
           {categories.map((cat: any) => {
              const isActive = pathname === `/shop/category/${cat._id}`;
              return (
                <Link
                  key={cat._id}
                  href={`/shop/category/${cat._id}`}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                    isActive 
                      ? "bg-zinc-900 text-white" 
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  {cat.name}
                </Link>
              );
           })}
        </div>
      </div>
    </div>
  );
}
