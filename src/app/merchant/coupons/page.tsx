"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, DollarSign, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export const runtime = 'edge';

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
}

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

export default function MerchantCouponsPage() {
  const { getToken, userId } = useAuth();
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("all");
  const [merchantId, setMerchantId] = React.useState<string | null>(null);

  // Fetch merchant ID first
  React.useEffect(() => {
    const fetchMerchantId = async () => {
      try {
        const token = await getToken();
        // Try /merchants/me first, fallback to /merchants/my-status
        let response;
        try {
          response = await axiosInstance.get("/merchants/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          response = await axiosInstance.get("/merchants/my-status", {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        
        if (response.data?.success) {
          const merchant = response.data.data?.merchant || response.data.data;
          if (merchant?._id) {
            setMerchantId(merchant._id);
          }
        } else if (response.data?._id) {
          setMerchantId(response.data._id);
        } else if (response.data?.merchant?._id) {
          setMerchantId(response.data.merchant._id);
        }
      } catch (error) {
        console.error("Error fetching merchant ID:", error);
      }
    };
    fetchMerchantId();
  }, [getToken]);

  const fetchCoupons = React.useCallback(async () => {
    if (!merchantId) return;

    try {
      setLoading(true);
      const token = await getToken();
      const params = new URLSearchParams();
      params.append("merchantId", merchantId);

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
  }, [getToken, merchantId]);

  React.useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SDG",
    }).format(amount);
  };

  const filteredCoupons = React.useMemo(() => {
    let filtered = coupons.filter((coupon) => {
      const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    // Filter by tab
    const now = new Date();
    if (activeTab === "active") {
      filtered = filtered.filter(
        (coupon) =>
          coupon.isActive &&
          new Date(coupon.startDate) <= now &&
          new Date(coupon.endDate) >= now
      );
    } else if (activeTab === "expired") {
      filtered = filtered.filter((coupon) => new Date(coupon.endDate) < now);
    }

    return filtered;
  }, [coupons, searchQuery, activeTab]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const now = new Date();
    const activeCoupons = coupons.filter(
      (coupon) =>
        coupon.isActive &&
        new Date(coupon.startDate) <= now &&
        new Date(coupon.endDate) >= now
    );
    const totalDiscountGiven = coupons.reduce(
      (sum, coupon) => sum + (coupon.totalDiscountGiven || 0),
      0
    );
    const totalOrders = coupons.reduce(
      (sum, coupon) => sum + (coupon.totalOrders || 0),
      0
    );

    return {
      activeCount: activeCoupons.length,
      totalDiscountGiven,
      totalOrders,
      totalCoupons: coupons.length,
    };
  }, [coupons]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">الكوبونات المطبقة على منتجاتي</h1>
        <p className="text-muted-foreground mt-1">
          عرض الكوبونات المطبقة على منتجاتك وتأثيرها على المبيعات
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الكوبونات النشطة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground">كوبون نشط حالياً</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخصومات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalDiscountGiven)}
            </div>
            <p className="text-xs text-muted-foreground">من جميع الكوبونات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات من الكوبونات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">طلب باستخدام الكوبونات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الكوبونات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCoupons}</div>
            <p className="text-xs text-muted-foreground">كوبون مطبق على منتجاتك</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="active">نشط</TabsTrigger>
          <TabsTrigger value="expired">منتهي</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Coupons Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الحد الأدنى</TableHead>
                  <TableHead>تاريخ النهاية</TableHead>
                  <TableHead>الاستخدام</TableHead>
                  <TableHead>الخصومات الممنوحة</TableHead>
                  <TableHead>الطلبات</TableHead>
                  <TableHead>الحالة</TableHead>
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
                      لا توجد كوبونات مطبقة على منتجاتك
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
                        <TableCell>{formatDate(coupon.endDate)}</TableCell>
                        <TableCell>
                          {coupon.usageCount || 0} /{" "}
                          {coupon.usageLimitGlobal || "∞"}
                        </TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {formatCurrency(coupon.totalDiscountGiven || 0)}
                        </TableCell>
                        <TableCell>{coupon.totalOrders || 0}</TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "نشط" : isExpired ? "منتهي" : "معطل"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
