"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Package, DollarSign, ShoppingCart, Ruler, Calendar, FileText, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice: number;
  stock: number;
  isActive: boolean;
  description: string;
  images: string[];
  sizes: string[];
  createdAt: string;
  updatedAt: string;
  merchant?: string;
}

interface ProductDetailsDialogProps {
  product: Product;
}

export function ProductDetailsDialog({ product }: ProductDetailsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [imageErrors, setImageErrors] = React.useState<Set<number>>(new Set());

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SDG",
    }).format(amount);
  };

  // price = original price, discountPrice = final selling price
  const originalPrice = typeof product.price === 'number' && !isNaN(product.price) && isFinite(product.price) ? product.price : 0;
  const finalPrice = typeof product.discountPrice === 'number' && !isNaN(product.discountPrice) && isFinite(product.discountPrice) && product.discountPrice > 0
    ? product.discountPrice 
    : originalPrice;
  const hasDiscount = finalPrice < originalPrice && product.discountPrice && product.discountPrice > 0;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;

  const validImages = product.images?.filter((_, index) => !imageErrors.has(index)) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Eye className="h-4 w-4 ml-2" />
          عرض التفاصيل الكاملة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            التفاصيل الكاملة للمنتج
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
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
                  <div className="w-full h-64 rounded-lg overflow-hidden bg-muted">
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
                    {formatCurrency(finalPrice)}
                  </p>
                </div>
                
                {hasDiscount && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">السعر الأصلي</p>
                      <p className="text-lg line-through text-muted-foreground">
                        {formatCurrency(originalPrice)}
                      </p>
                      <Badge className="mt-2 bg-red-100 text-red-800">
                        خصم {discountPercentage}%
                      </Badge>
                    </div>
                  </>
                )}
                
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
                  onClick={() => {
                    navigator.clipboard.writeText(product._id);
                  }}
                >
                  نسخ المعرف
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

