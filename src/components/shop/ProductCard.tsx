"use client";

import Link from "next/link";
import Image from "next/image";
import { ProductDTO } from "@/types/shop";
import { Button } from "@/components/ui/button";
import { IconShoppingCart, IconHeart } from "@tabler/icons-react";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: ProductDTO;
}

// ... imports
import { resolvePrice } from "@/lib/pricing";

interface ProductCardProps {
  product: ProductDTO;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const priceData = resolvePrice({ product });

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock && product.stock > 0) {
      // Note: For variants, this might need to open modal or pick default. 
      // For now, if requiresSelection is true, maybe redirect to detail? 
      // Or add "Simple" variant if available.
      if (priceData.requiresSelection) {
        window.location.href = `/shop/product/${product._id}`;
        return;
      }

      addItem(product, 1);
      toast.success("تمت الإضافة للسلة");
    }
  };

  const isOutOfStock = product.stock === 0;
  const hasDiscount = !!priceData.discount;

  return (
    <Link href={`/shop/product/${product._id}`} className="group relative block bg-white rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-200/50 hover:-translate-y-1">

      {/* Image Container */}
      <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-zinc-100/50">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-zinc-300">
            <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center">?</div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3 flex flex-col gap-1.5 md:gap-2 z-10">
          {hasDiscount && (
            <Badge className="rounded-full shadow-sm bg-red-500 hover:bg-red-600 text-white border-none px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs">
              -{priceData.discount?.percentage}%
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="secondary" className="rounded-full bg-zinc-900 text-white backdrop-blur-md px-2 md:px-3 text-[10px] md:text-xs font-normal">
              نفذت الكمية
            </Badge>
          )}
        </div>

        {/* Quick Action Overlay (Desktop) */}
        {!isOutOfStock && (
          <div className="absolute inset-x-4 bottom-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
            <Button
              onClick={handleQuickAdd}
              className="w-full rounded-2xl shadow-xl bg-white/90 backdrop-blur-md text-zinc-900 hover:bg-zinc-900 hover:text-white h-12 font-medium"
            >
              <IconShoppingCart className="w-4 h-4 ml-2" />
              {priceData.requiresSelection ? "اختر المقاس للتتمة" : "إضافة سريعة"}
            </Button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 md:p-5">
        <div className="flex justify-between items-start gap-1.5 md:gap-2 mb-1.5 md:mb-2">
          <h3 className="font-semibold text-zinc-900 line-clamp-1 text-sm md:text-base group-hover:text-amber-700 transition-colors">
            {product.name}
          </h3>
          {!isOutOfStock && hasDiscount && (
            <span className="text-[10px] md:text-xs font-bold text-red-500 bg-red-50 px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap hidden xs:inline">
              خصم
            </span>
          )}
        </div>

        <p className="text-xs md:text-sm text-zinc-500 line-clamp-1 mb-2 md:mb-4 h-4 md:h-5 font-light hidden xs:block">{product.description}</p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="font-bold text-sm md:text-lg text-zinc-900 font-numeric">
              {priceData.requiresSelection && <span className="text-[10px] md:text-xs font-normal text-zinc-400 ml-0.5 md:ml-1 hidden xs:inline">تبدأ من</span>}
              {priceData.final.toLocaleString()} <span className="text-[10px] md:text-xs font-medium text-zinc-400">ج.س</span>
            </span>
            {hasDiscount && (
              <span className="text-[10px] md:text-xs text-zinc-400 line-through decoration-zinc-400/50">
                {priceData.original.toLocaleString()} ج.س
              </span>
            )}
          </div>

          {/* Mobile Quick Add Icon */}
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 md:h-10 md:w-10 rounded-full md:hidden bg-zinc-100 text-zinc-900"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
          >
            <IconShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
