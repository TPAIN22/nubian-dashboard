'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Analytics {
  totalMerchants: number;
  pendingMerchants: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        } else {
          toast.error('فشل تحميل الإحصائيات');
        }
      } catch (error) {
        console.error('Analytics fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
    }).format(amount);
  };

  if (loading) {
     return <div className="flex items-center justify-center min-h-[400px]">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم النظام</h1>
          <p className="text-muted-foreground mt-1 text-base">نظرة عامة على أداء المنصة والعمليات الجارية.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/support" className="flex items-center gap-2">
             الدعم الفني <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التجار</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMerchants}</div>
            <p className="text-xs text-muted-foreground mt-1">تجار نشطون في المنصة</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-amber-500/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">طلبات معلقة</CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats?.pendingMerchants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/admin/applications" className="underline hover:text-primary">مراجعة الطلبات الآن</Link>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">منتج معروض في السوق</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">صافي الإيرادات المؤكدة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-primary" />
               النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
               سيتم عرض الرسم البياني قريباً...
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
               <AlertCircle className="w-5 h-5" />
               تنبيهات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {stats?.pendingMerchants && stats.pendingMerchants > 0 ? (
               <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0 animate-pulse" />
                  <div>
                     <p className="text-sm font-medium">طلبات انضمام جديدة</p>
                     <p className="text-xs text-muted-foreground mt-0.5">يوجد {stats.pendingMerchants} تجار ينتظرون الموافقة.</p>
                  </div>
               </div>
             ) : (
               <p className="text-sm text-center py-8 text-muted-foreground">لا توجد تنبيهات عاجلة حالياً.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
