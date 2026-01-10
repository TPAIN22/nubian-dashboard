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
import { Eye, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react";
import { axiosInstance } from '@/lib/axiosInstance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import type { Merchant } from "./page";

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
  merchant?: string | {
    _id: string;
    businessName: string;
    businessEmail: string;
    status?: string;
  };
}

interface MerchantDetailsDialogProps {
  merchant: Merchant;
}

export function MerchantDetailsDialog({ merchant }: MerchantDetailsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchMerchantProducts = React.useCallback(async () => {
    if (!open) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      
      // Use admin endpoint to get all products for this merchant (including inactive/deleted if needed)
      // Build query params - admin endpoint supports merchant filter
      const queryParams = new URLSearchParams();
      queryParams.append('merchant', merchant._id);
      // Optionally include deleted products if you want to show them
      // queryParams.append('includeDeleted', 'true');
      
      const url = `/products/admin/all?${queryParams.toString()}`;
      
      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      let fetchedProducts: Product[] = [];
      
      // Admin endpoint returns: { success: true, data: [...], page, limit, total }
      if (response.data?.success && Array.isArray(response.data?.data)) {
        fetchedProducts = response.data.data;
      } else if (Array.isArray(response.data?.products)) {
        fetchedProducts = response.data.products;
      } else if (Array.isArray(response.data)) {
        fetchedProducts = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        fetchedProducts = response.data.data;
      }
      
      // Additional safety: filter by merchant ID in case API didn't filter correctly
      // Product.merchant is an ObjectId reference, so compare by string
      if (merchant._id) {
        fetchedProducts = fetchedProducts.filter((p: Product) => {
          // Handle both populated (object) and unpopulated (string/ObjectId) merchant field
          const productMerchantId = typeof p.merchant === 'object' && p.merchant?._id 
            ? p.merchant._id.toString() 
            : p.merchant?.toString();
          return productMerchantId === merchant._id.toString();
        });
      }
      
      setProducts(fetchedProducts);
    } catch (err: any) {
      console.error('Error fetching merchant products:', err);
      setError(err.response?.data?.message || 'فشل في تحميل المنتجات');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [open, merchant._id, getToken]);

  React.useEffect(() => {
    fetchMerchantProducts();
  }, [fetchMerchantProducts]);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">عرض التفاصيل</span>
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل العلامة التجارية</DialogTitle>
          <DialogDescription>
            معلومات العلامة التجارية والمنتجات المتاحة
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Merchant Information */}
          <Card>
            <CardHeader>
              <CardTitle>{merchant.businessName}</CardTitle>
              <CardDescription>معلومات العلامة التجارية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">البريد الإلكتروني</p>
                    <p className="text-sm text-muted-foreground">{merchant.businessEmail}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">رقم الهاتف</p>
                    <p className="text-sm text-muted-foreground">
                      {merchant.businessPhone || "غير محدد"}
                    </p>
                  </div>
                </div>
                
                {merchant.businessAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">العنوان</p>
                      <p className="text-sm text-muted-foreground">{merchant.businessAddress}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">تاريخ الموافقة</p>
                    <p className="text-sm text-muted-foreground">
                      {merchant.approvedAt ? formatDate(merchant.approvedAt) : "غير محدد"}
                    </p>
                  </div>
                </div>
              </div>
              
              {merchant.businessDescription && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">الوصف</p>
                      <p className="text-sm text-muted-foreground">{merchant.businessDescription}</p>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">الحالة:</span>
                <Badge className="bg-green-100 text-green-800">
                  موافق عليه
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Products Section */}
          <Card>
            <CardHeader>
              <CardTitle>المنتجات ({products.length})</CardTitle>
              <CardDescription>جميع منتجات هذه العلامة التجارية</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">جاري تحميل المنتجات...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">لا توجد منتجات متاحة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = React.useState(false);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {product.images && product.images.length > 0 && !imageError ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-muted-foreground">لا توجد صورة</span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm truncate">{product.name}</h4>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "متاح" : "غير متاح"}
              </Badge>
            </div>
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">
                  {(() => {
                    // price = original price, discountPrice = final selling price
                    const originalPrice = typeof product.price === 'number' && !isNaN(product.price) && isFinite(product.price) ? product.price : 0;
                    const finalPrice = typeof product.discountPrice === 'number' && !isNaN(product.discountPrice) && isFinite(product.discountPrice) && product.discountPrice > 0
                      ? product.discountPrice
                      : originalPrice;
                    return new Intl.NumberFormat("ar-SA", {
                      style: "currency",
                      currency: "SDG",
                    }).format(finalPrice);
                  })()}
                </span>
                {(() => {
                  // price = original price, discountPrice = final selling price
                  const originalPrice = typeof product.price === 'number' && !isNaN(product.price) && isFinite(product.price) ? product.price : 0;
                  const finalPrice = typeof product.discountPrice === 'number' && !isNaN(product.discountPrice) && isFinite(product.discountPrice) && product.discountPrice > 0
                    ? product.discountPrice
                    : originalPrice;
                  const hasDiscount = finalPrice < originalPrice && product.discountPrice && product.discountPrice > 0;
                  return hasDiscount ? (
                    <span className="text-xs text-muted-foreground line-through">
                      {new Intl.NumberFormat("ar-SA", {
                        style: "currency",
                        currency: "SDG",
                      }).format(originalPrice)}
                    </span>
                  ) : null;
                })()}
              </div>
              
              <p className="text-xs text-muted-foreground">
                الكمية المتاحة: {product.stock}
              </p>
              
              {product.sizes && product.sizes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  المقاسات: {product.sizes.join(", ")}
                </p>
              )}
            </div>
            
            <div className="mt-3">
              <Link href={`/business/products/${product._id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفاصيل الكاملة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

