"use client";

import { shopApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { IconCategory } from "@tabler/icons-react";

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: shopApi.getCategories,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-zinc-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">حدث خطأ أثناء تحميل التصنيفات</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">تسوق حسب التصنيف</h1>
        <p className="text-zinc-500">استعرض منتجاتنا المميزة في مختلف الأقسام</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories?.map((category: any) => (
          <Link
            key={category._id}
            href={`/shop/category/${category._id}`}
            className="group relative block bg-white rounded-3xl overflow-hidden border border-zinc-100 hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="aspect-square relative bg-zinc-50 overflow-hidden">
                {category.image ? (
                   <Image 
                      src={category.image} 
                      alt={category.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                   />
                ) : (
                   <div className="flex items-center justify-center h-full w-full text-zinc-300">
                      <IconCategory className="w-12 h-12 stroke-1" />
                   </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-70" />
                
                <div className="absolute bottom-0 inset-x-0 p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                   <h3 className="text-xl font-bold">{category.name}</h3>
                   {category.description && (
                      <p className="text-sm text-white/80 line-clamp-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {category.description}
                      </p>
                   )}
                </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
