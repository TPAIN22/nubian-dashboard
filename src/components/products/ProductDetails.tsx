"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, Ruler, Calendar, FileText, Image as ImageIcon, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";

import { formatCurrency } from "@/lib/currency";
import { DEFAULT_NUBIAN_MARKUP } from "@/lib/pricing.config";
import {
  discountPercentage,
  finalAmount,
  formatFinalPrice,
  formatOriginalPrice,
  hasDiscount,
  type PricedProduct,
} from "@/features/products/types/product";

export interface Product extends PricedProduct {
  _id: string;
  name: string;
  nubianMarkup?: number; // Nubian markup percentage
  dynamicMarkup?: number; // Dynamic markup percentage
  stock: number;
  isActive: boolean;
  description: string;
  images: string[];
  sizes: string[];
  createdAt: string;
  updatedAt: string;
  // Populated by the backend as `storeName email logoUrl city status` — the
  // Merchant model has no `businessName`/`businessEmail`.
  merchant?: string | {
    _id: string;
    storeName: string;
    email?: string;
    status?: string;
  };
  category?: {
    _id: string;
    name: string;
  } | string;
  priorityScore?: number;
  featured?: boolean;
  pricingBreakdown?: {
    merchantPrice: number;
    nubianMarkup: number;
    dynamicMarkup: number;
    finalPrice: number;
  };
}

interface ProductDetailsProps {
  product: Product;
  showActions?: boolean;
  onEdit?: () => void;
  onToggleActive?: () => void;
  editUrl?: string;
}

export function ProductDetails({ product, showActions = false, onEdit, onToggleActive, editUrl }: ProductDetailsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [imageErrors, setImageErrors] = React.useState<Set<number>>(new Set());
  const [copied, setCopied] = React.useState(false);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const handleCopyId = () => {
    navigator.clipboard.writeText(product._id);
    setCopied(true);
    toast.success('تم نسخ معرف المنتج');
    setTimeout(() => setCopied(false), 2000);
  };

  // Customer-facing pricing. `merchantPrice` is COST — the engine floors
  // finalPrice at it, so it is never the "was" price and `final < merchant` is
  // a predicate that can never be true. Read the backend's own fields instead.
  const finalPrice = finalAmount(product);
  const showDiscount = hasDiscount(product);
  const discountPct = discountPercentage(product);

  // Internal margin view — this is the one place `merchantPrice` belongs.
  const merchantCost = product.merchantPrice ?? product.basePrice ?? 0;
  const pricingBreakdown = product.pricingBreakdown || {
    merchantPrice: merchantCost,
    nubianMarkup: product.nubianMarkup || DEFAULT_NUBIAN_MARKUP,
    dynamicMarkup: product.dynamicMarkup || 0,
    finalPrice: finalPrice,
  };

  const validImages = product.images?.filter((_, index) => !imageErrors.has(index)) || [];

  return (
    <div className="space-y-6">
      {/* Page Header with Actions */}
      {showActions && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground mt-1">التفاصيل الكاملة للمنتج</p>
          </div>
          <div className="flex gap-2">
            {(onEdit || editUrl) && (
              editUrl ? (
                <Link href={editUrl}>
                  <Button>
                    تعديل المنتج
                  </Button>
                </Link>
              ) : (
                <Button onClick={onEdit}>
                  تعديل المنتج
                </Button>
              )
            )}
            {onToggleActive && (
              <Button 
                variant={product.isActive ? "destructive" : "default"}
                onClick={onToggleActive}
              >
                {product.isActive ? "تعطيل المنتج" : "تفعيل المنتج"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Product Images */}
      {validImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              صور المنتج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Main Image */}
              <div className="w-full h-96 rounded-lg overflow-hidden bg-muted">
                {validImages[selectedImageIndex] ? (
                  <img
                    src={validImages[selectedImageIndex]}
                    alt={`${product.name} - صورة ${selectedImageIndex + 1}`}
                    className="w-full h-full object-contain"
                    onError={() => handleImageError(selectedImageIndex)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground">لا توجد صورة</span>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Images */}
              {validImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {validImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(index)}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing & Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              السعر والمخزون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">السعر النهائي</p>
              <p className="text-2xl font-bold text-primary">
                {formatFinalPrice(product)}
              </p>
            </div>

            {showDiscount && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">السعر الأصلي</p>
                  <p className="text-lg line-through text-muted-foreground">
                    {formatOriginalPrice(product)}
                  </p>
                  {discountPct > 0 && (
                    <Badge className="mt-2 bg-red-100 text-red-800">
                      خصم {discountPct}%
                    </Badge>
                  )}
                </div>
              </>
            )}
            
            {/* Pricing Breakdown */}
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">تفاصيل التسعير</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر التاجر:</span>
                  <span>{formatCurrency(pricingBreakdown.merchantPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">هامش نوبيان:</span>
                  <span>{pricingBreakdown.nubianMarkup}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">هامش ديناميكي:</span>
                  <span>{pricingBreakdown.dynamicMarkup}%</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t">
                  <span>السعر النهائي:</span>
                  <span className="text-primary">{formatCurrency(pricingBreakdown.finalPrice)}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">الكمية المتاحة</p>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg font-semibold">{product.stock} قطعة</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">الحالة</p>
              <Badge variant={product.isActive ? "default" : "secondary"} className="text-sm">
                {product.isActive ? "متاح للبيع" : "غير متاح"}
              </Badge>
            </div>

            {/* Admin-only fields */}
            {(product.featured !== undefined || product.priorityScore !== undefined) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {product.featured !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">مميز</p>
                      <Badge variant={product.featured ? "default" : "secondary"}>
                        {product.featured ? "نعم" : "لا"}
                      </Badge>
                    </div>
                  )}
                  {product.priorityScore !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">أولوية الترتيب</p>
                      <p className="text-sm">{product.priorityScore} / 100</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sizes & Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              المقاسات والتفاصيل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.sizes && product.sizes.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">المقاسات المتاحة</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, index) => (
                    <Badge key={index} variant="outline">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">المقاسات المتاحة</p>
                <p className="text-sm text-muted-foreground">لا توجد مقاسات محددة</p>
              </div>
            )}
            
            {product.category && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">التصنيف</p>
                  <p className="text-sm">
                    {typeof product.category === 'object' && product.category?.name 
                      ? product.category.name 
                      : typeof product.category === 'string' 
                        ? product.category 
                        : 'غير محدد'}
                  </p>
                </div>
              </>
            )}

            {typeof product.merchant === 'object' && product.merchant && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">التاجر</p>
                  <p className="text-sm">{product.merchant.storeName}</p>
                  {product.merchant.email && (
                    <p className="text-xs text-muted-foreground">{product.merchant.email}</p>
                  )}
                </div>
              </>
            )}
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">تاريخ الإنشاء</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(product.createdAt)}</p>
              </div>
            </div>
            
            {product.updatedAt !== product.createdAt && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">آخر تحديث</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(product.updatedAt)}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              الوصف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Product ID */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">معرف المنتج</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">{product._id}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyId}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 ml-2" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 ml-2" />
                  نسخ المعرف
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
