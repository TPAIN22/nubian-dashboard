'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { axiosInstance } from '@/lib/axiosInstance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import logger from '@/lib/logger'

interface Merchant {
  _id: string
  businessName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

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

export default function MerchantDashboard() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [productsCount, setProductsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    // Check if user has merchant role before making API calls
    // This prevents unnecessary redirects to apply page
    const userRole = user?.publicMetadata?.role as string | undefined
    if (userRole !== 'merchant') {
      // User doesn't have merchant role, redirect to apply
      router.replace('/merchant/apply')
      return
    }

    const loadDashboardData = async () => {
      try {
        const token = await getToken()
        
        if (!token) {
          logger.error('Authentication token is null', {})
          toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
          router.push('/sign-in')
          return
        }
        
        // Check merchant status
        const statusResponse = await axiosInstance.get('/merchants/my-status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (statusResponse.data.hasApplication) {
          const merchantData = statusResponse.data.merchant
          setMerchant(merchantData)
          
          if (merchantData.status !== 'APPROVED') {
            router.replace('/merchant/pending')
            return
          }

          // Load stats
          try {
            const statsResponse = await axiosInstance.get('/orders/merchant/stats', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            setStats(statsResponse.data)
          } catch (error) {
            logger.error('Error loading stats', { error: error instanceof Error ? error.message : String(error) })
          }

          // Load products count
          try {
            const productsResponse = await axiosInstance.get('/products/merchant/my-products', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            // Backend returns standardized paginated response: { success, data: [...], meta: { pagination: { total, ... } } }
            const totalCount = productsResponse.data.meta?.pagination?.total ?? productsResponse.data.data?.length ?? 0
            setProductsCount(totalCount)
          } catch (error) {
            logger.error('Error loading products', { error: error instanceof Error ? error.message : String(error) })
          }
        } else {
          // User has merchant role but no application - redirect to apply
          router.replace('/merchant/apply')
          return
        }
      } catch (error: any) {
        logger.error('Error loading dashboard', { 
          error: error instanceof Error ? error.message : String(error),
          status: error.response?.status 
        })
        // Only redirect to apply if it's a 404 (no application found)
        // For other errors, show the error but don't redirect
        if (error.response?.status === 404) {
          router.replace('/merchant/apply')
          return
        }
        // For other errors, just set loading to false and show error
        // Don't redirect - let the user see the error
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, router])

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    )
  }

  if (!merchant) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
      <div>
        <h1 className="text-2xl font-bold">لوحة تحكم التاجر</h1>
        <p className="text-muted-foreground mt-2">
          أهلاً بعودتك، {merchant.businessName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              جميع الطلبات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats ? formatCurrency(stats.totalRevenue) : '0.00 ج.س'}
            </div>
            <p className="text-xs text-muted-foreground">
              من جميع الطلبات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsCount}</div>
            <p className="text-xs text-muted-foreground">
              منتجات نشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">نشط</div>
            <p className="text-xs text-muted-foreground">
              التاجر معتمد
            </p>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>الطلبات حسب الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>قيد الانتظار:</span>
                  <span className="font-medium">{stats.statusStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>مؤكد:</span>
                  <span className="font-medium">{stats.statusStats.confirmed}</span>
                </div>
                <div className="flex justify-between">
                  <span>تم الشحن:</span>
                  <span className="font-medium">{stats.statusStats.shipped}</span>
                </div>
                <div className="flex justify-between">
                  <span>تم التسليم:</span>
                  <span className="font-medium text-green-600">{stats.statusStats.delivered}</span>
                </div>
                <div className="flex justify-between">
                  <span>ملغي:</span>
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>تم التسليم:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(stats.revenueByStatus.delivered)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>تم الشحن:</span>
                  <span className="font-medium">
                    {formatCurrency(stats.revenueByStatus.shipped)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>مؤكد:</span>
                  <span className="font-medium">
                    {formatCurrency(stats.revenueByStatus.confirmed)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>قيد الانتظار:</span>
                  <span className="font-medium">
                    {formatCurrency(stats.revenueByStatus.pending)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/merchant/products">
              <Button variant="outline" className="w-full">
                إدارة المنتجات
              </Button>
            </Link>
            <Link href="/merchant/orders">
              <Button variant="outline" className="w-full">
                عرض الطلبات
              </Button>
            </Link>
            <Link href="/merchant/settings">
              <Button variant="outline" className="w-full">
                إعدادات المتجر
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

