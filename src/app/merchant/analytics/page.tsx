'use client'

import { useEffect, useState } from 'react'
import { axiosInstance } from '@/lib/axiosInstance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import logger from '@/lib/logger'


interface Stats {
  totalOrders: number
  totalRevenue: number
  statusStats: {
    pending: number
    confirmed: number
    shipped: number
    delivered: number
    cancelled: number
  }
  revenueByStatus: {
    pending: number
    confirmed: number
    shipped: number
    delivered: number
    cancelled: number
  }
}

export default function MerchantAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get('/orders/merchant/stats')
        setStats(response.data)
      } catch (error: any) {
        logger.error('Error fetching analytics', { error: error instanceof Error ? error.message : String(error) })
        toast.error('فشل تحميل التحليلات')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
      <h1 className="text-2xl font-bold">التحليلات</h1>

      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">جميع الطلبات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">من جميع الطلبات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الطلبات المسلمة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.statusStats.delivered}
                </div>
                <p className="text-xs text-muted-foreground">طلبات مكتملة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الطلبات المعلقة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.statusStats.pending}
                </div>
                <p className="text-xs text-muted-foreground">في انتظار المعالجة</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>الطلبات حسب الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">قيد الانتظار:</span>
                    <span className="font-medium">{stats.statusStats.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">مؤكد:</span>
                    <span className="font-medium">{stats.statusStats.confirmed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">تم الشحن:</span>
                    <span className="font-medium">{stats.statusStats.shipped}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">تم التسليم:</span>
                    <span className="font-medium text-green-600">{stats.statusStats.delivered}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ملغي:</span>
                    <span className="font-medium text-red-600">{stats.statusStats.cancelled}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الإيرادات حسب الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">تم التسليم:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(stats.revenueByStatus.delivered)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">تم الشحن:</span>
                    <span className="font-medium">
                      {formatCurrency(stats.revenueByStatus.shipped)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">مؤكد:</span>
                    <span className="font-medium">
                      {formatCurrency(stats.revenueByStatus.confirmed)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">قيد الانتظار:</span>
                    <span className="font-medium">
                      {formatCurrency(stats.revenueByStatus.pending)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!stats && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لا توجد بيانات تحليلية متاحة بعد.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

