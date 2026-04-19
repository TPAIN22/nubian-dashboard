"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  IconCash, 
  IconShoppingCart, 
  IconClick, 
  IconTrendingUp, 
  IconCopy, 
  IconExternalLink,
  IconClock,
  IconCheck,
  IconAlertCircle
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AffiliateDashboard() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!isLoaded || !user) return;
      
      try {
        const [profileRes, statsRes, commissionsRes] = await Promise.all([
          fetch("/api/affiliate/me"),
          fetch("/api/affiliate/stats"),
          fetch("/api/affiliate/commissions?limit=5")
        ]);

        const profileData = await profileRes.json();
        const statsData = await statsRes.json();
        const commissionsData = await commissionsRes.json();

        if (profileRes.ok) setProfile(profileData.data);
        if (statsRes.ok) setStats(statsData.data);
        if (commissionsRes.ok) setCommissions(commissionsData.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast.error("فشل تحميل بيانات لوحة التحكم");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isLoaded, user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ إلى الحافظة");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SD", {
      style: "currency",
      currency: "SDG",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500">تم الدفع</Badge>;
      case "pending": return <Badge variant="outline" className="text-amber-600 border-amber-600">قيد الانتظار</Badge>;
      case "approved": return <Badge variant="secondary">معتمد</Badge>;
      case "rejected": return <Badge variant="destructive">مرفوض</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المسوق</h1>
          <p className="text-muted-foreground mt-1 text-base">
            أهلاً بك {profile?.name}، تابع أداءك وأرباحك من هنا.
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => window.open(`https://www.nubian-sd.store/?ref=${profile?.code}`, '_blank')}>
              <IconExternalLink size={18} className="ml-2" /> معاينة المتجر
           </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
            <IconCash className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(profile?.totalEarnings || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">الأرباح التي تم سحبها + المعتمدة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أرباح معلقة</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profile?.pendingEarnings || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">بانتظار تأكيد تسليم الطلبات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">عدد الطلبات التي تمت من خلالك</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الزيارات</CardTitle>
            <IconClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClicks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">عدد النقرات على رابط الإحالة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Referral Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconLink className="w-5 h-5 text-primary" />
              رابط الإحالة الخاص بك
            </CardTitle>
            <CardDescription>شارك هذا الرابط مع عملائك لكسب العمولات.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-md relative group">
              <p className="text-xs font-mono break-all pr-8 leading-relaxed">
                {profile?.referralLink || "جاري التحميل..."}
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1" 
                onClick={() => copyToClipboard(profile?.referralLink)}
              >
                <IconCopy size={16} />
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">كود الإحالة: <span className="font-mono text-primary font-bold">{profile?.code}</span></p>
              <p className="text-xs text-muted-foreground">نسبة العمولة: {profile?.commissionRate ? (profile.commissionRate * 100) : 10}%</p>
            </div>
            
            <div className="pt-2">
               <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                  <IconAlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>تأكد من استخدام الرابط الصحيح لضمان احتساب العمولات.</span>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Commissions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconCash className="w-5 h-5 text-primary" />
                آخر العمولات
              </CardTitle>
              <CardDescription>قائمة بأحدث العمولات المستحقة من طلبات عملائك.</CardDescription>
            </div>
            <Button variant="ghost" className="text-primary hover:text-primary/80" onClick={() => window.location.href = "/affiliate/commissions"}>
               عرض الكل
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>قيمة الطلب</TableHead>
                    <TableHead>العمولة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.length > 0 ? (
                    commissions.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell className="font-medium">#{c.order?.orderNumber}</TableCell>
                        <TableCell>{formatCurrency(c.orderAmount)}</TableCell>
                        <TableCell className="font-bold text-primary">{formatCurrency(c.amount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("ar-SD")}
                        </TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا توجد عمولات مسجلة حتى الآن. ابدأ بمشاركة رابطك!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
