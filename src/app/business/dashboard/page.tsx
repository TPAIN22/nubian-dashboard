import { axiosInstance } from '@/lib/axiosInstance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, ShoppingCart, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { Suspense } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  totalMerchants: number;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingMerchants: number;
}

async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Fetch individual data directly (stats endpoint doesn't exist yet)
    // Axios already has a 30-second timeout configured in axiosInstance
    // Use Promise.allSettled to handle errors gracefully without blocking
    const [productsRes, merchantsRes, ordersRes] = await Promise.allSettled([
      axiosInstance.get('/products'),
      axiosInstance.get('/merchants'),
      axiosInstance.get('/orders'),
    ]);

    // Helper function to extract data from response or return empty array
    const extractData = (result: PromiseSettledResult<any>, fallbackKey?: string): any[] => {
      if (result.status === 'fulfilled') {
        const response = result.value;
        // Handle axios response structure: response.data contains the actual data
        const data = response?.data || response;
        
        if (data?.success && Array.isArray(data.data)) {
          return data.data;
        }
        if (Array.isArray(data)) {
          return data;
        }
        if (fallbackKey && data?.[fallbackKey] && Array.isArray(data[fallbackKey])) {
          return data[fallbackKey];
        }
        return [];
      } else {
        return [];
      }
    };

    // Backend returns: { success: true, data: [...], meta: {...} }
    const products = extractData(productsRes, 'products');
    const merchants = extractData(merchantsRes, 'merchants');
    const orders = extractData(ordersRes, 'orders');

    const activeProducts = Array.isArray(products) 
      ? products.filter((p: any) => p.isActive !== false).length 
      : 0;

    const pendingMerchants = Array.isArray(merchants)
      ? merchants.filter((m: any) => m.status === 'PENDING').length
      : 0;

    // Calculate revenue from orders
    const totalRevenue = Array.isArray(orders)
      ? orders.reduce((sum: number, order: any) => {
          const orderTotal = order.total || order.totalPrice || 0;
          return sum + (typeof orderTotal === 'number' ? orderTotal : 0);
        }, 0)
      : 0;

    return {
      totalProducts: Array.isArray(products) ? products.length : 0,
      totalMerchants: Array.isArray(merchants) ? merchants.length : 0,
      totalOrders: Array.isArray(orders) ? orders.length : 0,
      totalRevenue,
      activeProducts,
      pendingMerchants,
    };
  } catch (error) {
    return {
      totalProducts: 0,
      totalMerchants: 0,
      totalOrders: 0,
      totalRevenue: 0,
      activeProducts: 0,
      pendingMerchants: 0,
    };
  }
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">جاري التحميل...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على منصة نوبيان</p>
      </div>

      <Suspense fallback={<StatsLoading />}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeProducts} منتج نشط
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التجار</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMerchants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingMerchants} في انتظار الموافقة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                جميع الطلبات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('ar-SA', {
                  style: 'currency',
                  currency: 'SDG',
                }).format(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                من جميع الطلبات
              </p>
            </CardContent>
          </Card>
        </div>
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات سريعة</CardTitle>
            <CardDescription>نظرة سريعة على الأداء</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">نسبة المنتجات النشطة</span>
                <span className="text-sm font-medium">
                  {stats.totalProducts > 0 
                    ? Math.round((stats.activeProducts / stats.totalProducts) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">متوسط قيمة الطلب</span>
                <span className="text-sm font-medium">
                  {stats.totalOrders > 0
                    ? new Intl.NumberFormat('ar-SA', {
                        style: 'currency',
                        currency: 'SDG',
                      }).format(stats.totalRevenue / stats.totalOrders)
                    : '0.00 SDG'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription>الوصول السريع للمهام الشائعة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link 
                href="/business/products" 
                className="block p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">إدارة المنتجات</span>
                </div>
              </Link>
              <Link 
                href="/business/merchants" 
                className="block p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">إدارة التجار</span>
                </div>
              </Link>
              <Link 
                href="/business/orders" 
                className="block p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm font-medium">إدارة الطلبات</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {stats.pendingMerchants > 0 && (
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                تنبيهات
              </CardTitle>
              <CardDescription>يوجد طلبات تحتاج إلى مراجعة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="text-sm">تجار في انتظار الموافقة</span>
                  <span className="text-sm font-bold text-orange-600">
                    {stats.pendingMerchants}
                  </span>
                </div>
                <Link 
                  href="/business/merchants" 
                  className="block w-full text-center p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  مراجعة الطلبات
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
