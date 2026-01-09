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
import { ProductDetailsDialog } from "./productDetailsDialog";
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
  merchant?: string;
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
      
      // Try to fetch products by merchant ID
      // Adjust the endpoint based on your API structure
      const response = await axiosInstance.get(`/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          merchant: merchant._id,
          merchantId: merchant._id,
        },
      });
      
      let fetchedProducts: Product[] = [];
      
      if (response.data?.success && Array.isArray(response.data?.data)) {
        fetchedProducts = response.data.data;
      } else if (Array.isArray(response.data?.products)) {
        fetchedProducts = response.data.products;
      } else if (Array.isArray(response.data)) {
        fetchedProducts = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        fetchedProducts = response.data.data;
      }
      
      // Filter products by merchant if not filtered by API
      if (merchant._id) {
        fetchedProducts = fetchedProducts.filter(
          (p: Product) => p.merchant === merchant._id || p.merchant === merchant.clerkId
        );
      }
      
      setProducts(fetchedProducts);
    } catch (err: any) {
      setError('فشل في تحميل المنتجات');
      // If specific endpoint fails, try getting all products and filtering
      try {
        const token = await getToken();
        const allProductsResponse = await axiosInstance.get("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        let allProducts: Product[] = [];
        
        if (allProductsResponse.data?.success && Array.isArray(allProductsResponse.data?.data)) {
          allProducts = allProductsResponse.data.data;
        } else if (Array.isArray(allProductsResponse.data)) {
          allProducts = allProductsResponse.data;
        }
        
        // Filter by merchant
        const filtered = allProducts.filter(
          (p: Product) => p.merchant === merchant._id || p.merchant === merchant.clerkId
        );
        setProducts(filtered);
        setError(null);
      } catch (fallbackErr) {
        setError('فشل في تحميل المنتجات');
      }
    } finally {
      setLoading(false);
    }
  }, [open, merchant._id, merchant.clerkId, getToken]);

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
                    const validPrice = typeof product.price === 'number' && !isNaN(product.price) && isFinite(product.price) ? product.price : 0;
                    return new Intl.NumberFormat("ar-SA", {
                      style: "currency",
                      currency: "SDG",
                    }).format(validPrice);
                  })()}
                </span>
                {(() => {
                  const validPrice = typeof product.price === 'number' && !isNaN(product.price) && isFinite(product.price) ? product.price : 0;
                  const validDiscountPrice = typeof product.discountPrice === 'number' && !isNaN(product.discountPrice) && isFinite(product.discountPrice) ? product.discountPrice : 0;
                  return validDiscountPrice > validPrice && validDiscountPrice > 0 ? (
                    <span className="text-xs text-muted-foreground line-through">
                      {new Intl.NumberFormat("ar-SA", {
                        style: "currency",
                        currency: "SDG",
                      }).format(validDiscountPrice)}
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
              <ProductDetailsDialog product={product} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

