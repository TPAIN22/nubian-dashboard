"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { shopApi } from "@/lib/api";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { VariantSelector } from "@/components/shop/VariantSelector";
import { useCart } from "@/store/useCart";
import { Button } from "@/components/ui/button";
import { IconShoppingCart, IconTruck, IconShieldCheck, IconMinus, IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { SelectedAttributes, ProductVariantDTO } from "@/types/shop";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { Separator } from "@/components/ui/separator";
import { resolvePrice } from "@/lib/pricing";

// Helper to find matching variant
const findVariant = (variants: ProductVariantDTO[], selection: SelectedAttributes) => {
  if (!variants || variants.length === 0) return null;
  return variants.find(v => {
     // Check if every selected attribute matches the variant's attributes
     // Note: variant.attributes might be Map in standard JS but Record in JSON DTO
     return Object.entries(selection).every(([key, val]) => v.attributes?.[key] === val);
  });
};

export default function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["shop", "product", params.id],
    queryFn: () => shopApi.getProduct(params.id),
  });

  const [selection, setSelection] = useState<SelectedAttributes>({});
  const [quantity, setQuantity] = useState(1);
  const addItem = useCart((state) => state.addItem);

  // Computed state based on selection
  const matchedVariant = product?.variants ? findVariant(product.variants, selection) : null;
  
  // Pricing & Stock via Engine
  const priceData = resolvePrice({ 
     product, 
     selectedVariant: matchedVariant || undefined 
  });
  
  const currentPrice = priceData.final;
  const originalPrice = priceData.original;
  const hasDiscount = !!priceData.discount;
  
  const currentStock = matchedVariant ? matchedVariant.stock : (product?.stock || 0);
  const isOutOfStock = currentStock === 0;

  const handleAddToCart = () => {
    if (!product) return;
    if (isOutOfStock) {
       toast.error("هذا المنتج غير متوفر حالياً");
       return;
    }

    // Check if required attributes are selected
    if (product.attributes && product.attributes.length > 0) {
       const missing = product.attributes.filter(attr => attr.required && !selection[attr.name]);
       if (missing.length > 0) {
          toast.error(`يرجى اختيار ${missing[0].displayName}`);
          return;
       }
    }
    
    // Warn if adding a variant product without variant selection (if logic requires it)
    if (priceData.requiresSelection && !matchedVariant) {
        toast.error("يرجى اختيار الخيارات المتاحة (اللون/المقاس)");
        return;
    }

    addItem(product, quantity, undefined, selection);
    toast.success("تمت الإضافة للسلة");
  };

  if (isLoading) return <div className="container py-12"><LoadingSkeleton /></div>;
  if (isError || !product) return (
     <div className="container py-20 text-center">
       <h2 className="text-2xl font-bold">المنتج غير موجود</h2>
     </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 pb-20">
      
      {/* Gallery Section */}
      <div>
         <ProductGallery images={matchedVariant?.images?.length ? matchedVariant.images : product.images} />
      </div>

      {/* Info Section - Sticky */}
      <div className="space-y-8 lg:sticky lg:top-24 h-fit">
         {/* Header */}
         <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-zinc-900 mb-2">{product.name}</h1>
            <div className="text-2xl lg:text-3xl font-bold text-zinc-900 flex items-center gap-3">
               {currentPrice?.toLocaleString()} <span className="text-sm font-medium text-zinc-500">جنيــه سوداني</span>
               {hasDiscount && (
                 <span className="text-lg text-zinc-400 line-through decoration-zinc-400">
                   {originalPrice?.toLocaleString()}
                 </span>
               )}
            </div>
         </div>
         
         <Separator />

         {/* Variants */}
         {product.attributes && product.attributes.length > 0 && (
            <VariantSelector 
               attributes={product.attributes} 
               onSelectionChange={setSelection} 
            />
         )}

         {/* Quantity & Actions */}
         <div className="space-y-6 pt-6">
            <div className="flex items-center gap-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
               <span className="font-semibold text-zinc-900">الكمية:</span>
               <div className="flex items-center bg-white rounded-xl shadow-sm border border-zinc-200">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors rounded-r-xl"
                  >
                     <IconMinus className="w-4 h-4 text-zinc-600 cursor-pointer" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="p-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors rounded-l-xl"
                  >
                     <IconPlus className="w-4 h-4 text-zinc-600 cursor-pointer" />
                  </button>
               </div>
               
               <div className="flex-1 text-right text-sm text-zinc-500">
                  {currentStock > 0 ? (
                      <span className="text-green-600 font-medium flex items-center justify-end gap-1">
                          ● {currentStock} قطعة متوفرة
                      </span>
                  ) : (
                      <span className="text-red-500 font-medium">● غير متوفر</span>
                  )}
               </div>
            </div>

            <Button 
               size="lg" 
               className="w-full rounded-xl text-white cursor-pointer h-14 text-lg bg-zinc-900 hover:bg-zinc-800 shadow-xl shadow-zinc-900/10"
               onClick={handleAddToCart}
               disabled={isOutOfStock}
            >
               <IconShoppingCart className="w-5 h-5 ml-2" />
               {isOutOfStock ? "نفذت الكمية" : "إضافة للسلة"}
            </Button>
         </div>

         <Separator />

         {/* Description */}
         <div className="prose prose-zinc max-w-none">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">تفاصيل المنتج</h3>
            <p className="text-zinc-600 leading-relaxed whitespace-pre-line">{product.description}</p>
         </div>

         {/* Trust Badges */}
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 p-4 rounded-xl flex items-center gap-3 border border-zinc-100">
               <IconTruck className="w-6 h-6 text-zinc-400" />
               <div>
                  <p className="font-semibold text-sm">توصيل سريع</p>
                  <p className="text-xs text-zinc-500">لكافة ولايات السودان</p>
               </div>
            </div>
            <div className="bg-zinc-50 p-4 rounded-xl flex items-center gap-3 border border-zinc-100">
               <IconShieldCheck className="w-6 h-6 text-zinc-400" />
               <div>
                  <p className="font-semibold text-sm">ضمان الجودة</p>
                  <p className="text-xs text-zinc-500">منتجات أصلية 100%</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
