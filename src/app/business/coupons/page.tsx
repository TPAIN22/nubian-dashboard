"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import CouponForm from "./couponForm";
// Date formatting utility
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
};

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimitPerUser: number;
  usageLimitGlobal?: number;
  usageCount: number;
  totalDiscountGiven: number;
  totalOrders: number;
  applicableProducts: any[];
  applicableCategories: any[];
  applicableMerchants: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CouponsPage() {
  const { getToken } = useAuth();
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterActive, setFilterActive] = React.useState<string>("all");
  const [selectedCoupon, setSelectedCoupon] = React.useState<Coupon | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  const fetchCoupons = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params = new URLSearchParams();
      if (filterActive !== "all") {
        params.append("isActive", filterActive === "active" ? "true" : "false");
      }
      if (filterActive === "expired") {
        params.append("expired", "true");
      }

      const response = await axiosInstance.get(`/coupons?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setCoupons(response.data.data || []);
      } else {
        setCoupons(response.data || []);
      }
    } catch (error: any) {
      toast.error("فشل تحميل الكوبونات", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, filterActive]);

  React.useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedCoupon(null);
    setShowForm(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكوبون؟")) return;

    try {
      const token = await getToken();
      await axiosInstance.delete(`/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("تم حذف الكوبون بنجاح");
      fetchCoupons();
    } catch (error: any) {
      toast.error("فشل حذف الكوبون", {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleDeactivate = async (couponId: string) => {
    try {
      const token = await getToken();
      await axiosInstance.patch(`/coupons/${couponId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("تم تعطيل الكوبون بنجاح");
      fetchCoupons();
    } catch (error: any) {
      toast.error("فشل تعطيل الكوبون", {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SDG",
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الكوبونات</h1>
          <p className="text-muted-foreground mt-1">إنشاء وإدارة كوبونات الخصم</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء كوبون جديد
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterActive === "all" ? "default" : "outline"}
            onClick={() => setFilterActive("all")}
          >
            الكل
          </Button>
          <Button
            variant={filterActive === "active" ? "default" : "outline"}
            onClick={() => setFilterActive("active")}
          >
            نشط
          </Button>
          <Button
            variant={filterActive === "expired" ? "default" : "outline"}
            onClick={() => setFilterActive("expired")}
          >
            منتهي
          </Button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>القيمة</TableHead>
              <TableHead>الحد الأدنى</TableHead>
              <TableHead>تاريخ البداية</TableHead>
              <TableHead>تاريخ النهاية</TableHead>
              <TableHead>الاستخدام</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : filteredCoupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  لا توجد كوبونات
                </TableCell>
              </TableRow>
            ) : (
              filteredCoupons.map((coupon) => {
                const isExpired = new Date(coupon.endDate) < new Date();
                const isActive = coupon.isActive && !isExpired;

                return (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-mono font-bold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.type === "percentage" ? "default" : "secondary"}>
                        {coupon.type === "percentage" ? "نسبة" : "ثابت"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.type === "percentage"
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value)}
                    </TableCell>
                    <TableCell>
                      {coupon.minOrderAmount > 0
                        ? formatCurrency(coupon.minOrderAmount)
                        : "—"}
                    </TableCell>
                    <TableCell>{formatDate(coupon.startDate)}</TableCell>
                    <TableCell>{formatDate(coupon.endDate)}</TableCell>
                    <TableCell>
                      {coupon.usageCount || 0} /{" "}
                      {coupon.usageLimitGlobal || "∞"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "نشط" : isExpired ? "منتهي" : "معطل"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(coupon)}
                        >
                          تعديل
                        </Button>
                        {coupon.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivate(coupon._id)}
                          >
                            تعطيل
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(coupon._id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Coupon Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCoupon ? "تعديل الكوبون" : "إنشاء كوبون جديد"}
            </DialogTitle>
            <DialogDescription>
              {selectedCoupon
                ? "قم بتعديل بيانات الكوبون"
                : "املأ البيانات لإنشاء كوبون خصم جديد"}
            </DialogDescription>
          </DialogHeader>
          <CouponForm
            coupon={selectedCoupon}
            onSuccess={() => {
              setShowForm(false);
              setSelectedCoupon(null);
              fetchCoupons();
            }}
            onCancel={() => {
              setShowForm(false);
              setSelectedCoupon(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
