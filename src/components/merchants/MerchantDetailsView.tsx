"use client";

import * as React from "react";
import { Mail, Phone, MapPin, Calendar, FileText, Eye, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { axiosInstance } from '@/lib/axiosInstance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Merchant } from "@/app/business/merchants/[merchantId]/page";

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number; // Legacy field
  merchantPrice?: number; // Base merchant price
  nubianMarkup?: number; // Nubian markup percentage
  dynamicMarkup?: number; // Dynamic markup percentage
  finalPrice?: number; // Smart pricing final price
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

interface MerchantDetailsViewProps {
  merchant: Merchant;
}

export function MerchantDetailsView({ merchant }: MerchantDetailsViewProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchMerchantProducts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      
      // Use admin endpoint to get all products for this merchant (including inactive/deleted if needed)
      const queryParams = new URLSearchParams();
      queryParams.append('merchant', merchant._id);
      
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
      if (merchant._id) {
        fetchedProducts = fetchedProducts.filter((p: Product) => {
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
  }, [merchant._id, getToken]);

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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{merchant.businessName}</h1>
        <p className="text-muted-foreground mt-1">معلومات العلامة التجارية والمنتجات المتاحة</p>
      </div>

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
              {merchant.status === "APPROVED" ? "موافق عليه" : merchant.status}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onUpdate={fetchMerchantProducts}
                  getToken={getToken}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onUpdate: () => void;
  getToken: () => Promise<string | null>;
}

function ProductCard({ product, onUpdate, getToken }: ProductCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.');
        return;
      }

      await axiosInstance.delete(`/products/${product._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('تم حذف المنتج بنجاح');
      setDeleteDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'فشل حذف المنتج');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.');
        return;
      }

      await axiosInstance.patch(
        `/products/admin/${product._id}/toggle-active`,
        { isActive: !product.isActive },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(product.isActive ? 'تم تعطيل المنتج بنجاح' : 'تم تفعيل المنتج بنجاح');
      onUpdate();
    } catch (error: any) {
      console.error('Error toggling product status:', error);
      toast.error(error.response?.data?.message || 'فشل تحديث حالة المنتج');
    } finally {
      setIsToggling(false);
    }
  };
  
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
                    // Smart pricing: finalPrice > discountPrice > price
                    const merchantPrice = product.merchantPrice || product.price || 0;
                    const finalPrice = product.finalPrice || product.discountPrice || product.price || 0;
                    const originalPrice = merchantPrice;
                    return new Intl.NumberFormat("ar-SA", {
                      style: "currency",
                      currency: "SDG",
                    }).format(finalPrice);
                  })()}
                </span>
                {(() => {
                  // Smart pricing: finalPrice > discountPrice > price
                  const merchantPrice = product.merchantPrice || product.price || 0;
                  const finalPrice = product.finalPrice || product.discountPrice || product.price || 0;
                  const originalPrice = merchantPrice;
                  const hasDiscount = finalPrice < merchantPrice;
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
            
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/business/products/${product._id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفاصيل
                </Button>
              </Link>
              
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/business/products/${product._id}/edit`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-4 w-4 ml-1" />
                    تعديل
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleToggleActive}
                  disabled={isToggling}
                >
                  {isToggling ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current ml-1" />
                  ) : product.isActive ? (
                    <>
                      <PowerOff className="h-4 w-4 ml-1" />
                      تعطيل
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 ml-1" />
                      تفعيل
                    </>
                  )}
                </Button>
              </div>
              
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من حذف المنتج <strong>{product.name}</strong>؟ 
                      هذا الإجراء لا يمكن التراجع عنه.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete} 
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "جاري الحذف..." : "حذف"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting || isToggling}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
