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
  const [loadingError, setLoadingError] = useState<string | null>(null)

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

    let maxLoadingTimer: NodeJS.Timeout | null = null

    const loadDashboardData = async () => {
      // Set a maximum loading time (30 seconds)
      maxLoadingTimer = setTimeout(() => {
        setLoadingError('استغرق التحميل وقتاً طويلاً. يرجى تحديث الصفحة أو التحقق من الاتصال بالإنترنت.')
        setLoading(false)
      }, 30000)

      try {
        // Add timeout for token retrieval
        let tokenTimeoutId: NodeJS.Timeout | null = null
        const tokenPromise = getToken()
        const timeoutPromise = new Promise<string | null>((_, reject) => {
          tokenTimeoutId = setTimeout(() => reject(new Error('Token retrieval timeout')), 10000)
        })
        
        let token: string | null
        try {
          token = await Promise.race([tokenPromise, timeoutPromise]) as string | null
          // Clear timeout if promise resolved before timeout
          if (tokenTimeoutId) {
            clearTimeout(tokenTimeoutId)
            tokenTimeoutId = null
          }
        } catch (error) {
          // Clear timeout on error
          if (tokenTimeoutId) {
            clearTimeout(tokenTimeoutId)
            tokenTimeoutId = null
          }
          logger.error('Token retrieval failed or timed out', { error: error instanceof Error ? error.message : String(error) })
          toast.error('فشل الحصول على رمز المصادقة. يرجى المحاولة مرة أخرى.')
          setLoading(false)
          if (maxLoadingTimer) {
            clearTimeout(maxLoadingTimer)
            maxLoadingTimer = null
          }
          return
        }
        
        if (!token) {
          logger.error('Authentication token is null', {})
          toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
          router.push('/sign-in')
          setLoading(false)
          if (maxLoadingTimer) {
            clearTimeout(maxLoadingTimer)
            maxLoadingTimer = null
          }
          return
        }
        
        // Check merchant status with timeout
        let statusTimeoutId: NodeJS.Timeout | null = null
        let statusResponse: any
        try {
          statusResponse = await Promise.race([
            axiosInstance.get('/merchants/my-status', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            new Promise((_, reject) => {
              statusTimeoutId = setTimeout(() => reject(new Error('Request timeout')), 25000)
            }),
          ]) as any
          // Clear timeout if promise resolved before timeout
          if (statusTimeoutId) {
            clearTimeout(statusTimeoutId)
            statusTimeoutId = null
          }
        } catch (statusError) {
          // Clear timeout on error
          if (statusTimeoutId) {
            clearTimeout(statusTimeoutId)
            statusTimeoutId = null
          }
          // Re-throw to be handled by outer catch
          throw statusError
        }
        if (statusResponse.data.hasApplication) {
          const merchantData = statusResponse.data.merchant
          setMerchant(merchantData)
          
          if (merchantData.status !== 'APPROVED') {
            router.replace('/merchant/pending')
            if (maxLoadingTimer) {
              clearTimeout(maxLoadingTimer)
              maxLoadingTimer = null
            }
            return
          }

          // Load stats with timeout
          try {
            let statsTimeoutId: NodeJS.Timeout | null = null
            try {
              const statsResponse = await Promise.race([
                axiosInstance.get('/orders/merchant/stats', {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }),
                new Promise((_, reject) => {
                  statsTimeoutId = setTimeout(() => reject(new Error('Stats request timeout')), 25000)
                }),
              ]) as any
              // Clear timeout if promise resolved before timeout
              if (statsTimeoutId) {
                clearTimeout(statsTimeoutId)
                statsTimeoutId = null
              }
              setStats(statsResponse.data)
            } catch (statsError) {
              // Clear timeout on error
              if (statsTimeoutId) {
                clearTimeout(statsTimeoutId)
                statsTimeoutId = null
              }
              throw statsError
            }
          } catch (error) {
            logger.error('Error loading stats', { error: error instanceof Error ? error.message : String(error) })
            // Don't block the page if stats fail to load
          }

          // Load products count with timeout
          try {
            let productsTimeoutId: NodeJS.Timeout | null = null
            try {
              const productsResponse = await Promise.race([
                axiosInstance.get('/products/merchant/my-products', {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }),
                new Promise((_, reject) => {
                  productsTimeoutId = setTimeout(() => reject(new Error('Products request timeout')), 25000)
                }),
              ]) as any
              // Clear timeout if promise resolved before timeout
              if (productsTimeoutId) {
                clearTimeout(productsTimeoutId)
                productsTimeoutId = null
              }
              // Backend returns standardized paginated response: { success, data: [...], meta: { pagination: { total, ... } } }
              const totalCount = productsResponse.data.meta?.pagination?.total ?? productsResponse.data.data?.length ?? 0
              setProductsCount(totalCount)
            } catch (productsError) {
              // Clear timeout on error
              if (productsTimeoutId) {
                clearTimeout(productsTimeoutId)
                productsTimeoutId = null
              }
              throw productsError
            }
          } catch (error) {
            logger.error('Error loading products', { error: error instanceof Error ? error.message : String(error) })
            // Don't block the page if products fail to load
          }
        } else {
          // User has merchant role but no application - redirect to apply
          router.replace('/merchant/apply')
          if (maxLoadingTimer) {
            clearTimeout(maxLoadingTimer)
            maxLoadingTimer = null
          }
          return
        }
      } catch (error: any) {
        logger.error('Error loading dashboard', { 
          error: error instanceof Error ? error.message : String(error),
          status: error.response?.status 
        })
        
        // Handle timeout errors
        if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
          toast.error('انتهت مهلة الطلب. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.')
          setLoading(false)
          if (maxLoadingTimer) {
            clearTimeout(maxLoadingTimer)
            maxLoadingTimer = null
          }
          return
        }
        
        // Only redirect to apply if it's a 404 (no application found)
        // For other errors, show the error but don't redirect
        if (error.response?.status === 404) {
          router.replace('/merchant/apply')
          setLoading(false)
          if (maxLoadingTimer) {
            clearTimeout(maxLoadingTimer)
            maxLoadingTimer = null
          }
          return
        }
        
        // For other errors, show error message
        toast.error('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.')
        setLoadingError('فشل تحميل البيانات. يرجى تحديث الصفحة.')
      } finally {
        if (maxLoadingTimer) {
          clearTimeout(maxLoadingTimer)
          maxLoadingTimer = null
        }
        setLoading(false)
      }
    }

    loadDashboardData()
    
    // Cleanup timer on unmount
    return () => {
      if (maxLoadingTimer) {
        clearTimeout(maxLoadingTimer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, router])

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 bg-background dark:bg-slate-950">
        <div className="text-xl font-semibold text-foreground">جاري التحميل...</div>
        {loadingError && (
          <div className="max-w-md p-6 bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 rounded-lg shadow-sm">
            <p className="text-destructive dark:text-destructive-foreground text-base font-medium mb-4">{loadingError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 font-medium text-sm transition-colors"
            >
              تحديث الصفحة
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!merchant) {
    if (loadingError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-6 bg-background dark:bg-slate-950">
          <div className="max-w-md p-6 bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 rounded-lg shadow-sm">
            <p className="text-destructive dark:text-destructive-foreground text-base font-medium mb-4">{loadingError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 font-medium transition-colors"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      )
    }
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-6 h-full sm:mx-12 mx-2 py-6 bg-background dark:bg-slate-950 min-h-screen">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">لوحة تحكم التاجر</h1>
        <p className="text-base text-muted-foreground">
          أهلاً بعودتك، <span className="font-medium text-foreground">{merchant.businessName}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats?.totalOrders || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              جميع الطلبات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-500">
              {stats ? formatCurrency(stats.totalRevenue) : '0.00 ج.س'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              من جميع الطلبات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{productsCount}</div>
            <p className="text-sm text-muted-foreground mt-1">
              منتجات نشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-500">نشط</div>
            <p className="text-sm text-muted-foreground mt-1">
              التاجر معتمد
            </p>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">الطلبات حسب الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">قيد الانتظار:</span>
                  <span className="text-base font-semibold text-foreground">{stats.statusStats.pending}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">مؤكد:</span>
                  <span className="text-base font-semibold text-foreground">{stats.statusStats.confirmed}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">تم الشحن:</span>
                  <span className="text-base font-semibold text-blue-600 dark:text-blue-400">{stats.statusStats.shipped}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">تم التسليم:</span>
                  <span className="text-base font-semibold text-green-600 dark:text-green-500">{stats.statusStats.delivered}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">ملغي:</span>
                  <span className="text-base font-semibold text-destructive">{stats.statusStats.cancelled}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">الإيرادات حسب الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">تم التسليم:</span>
                  <span className="text-base font-semibold text-green-600 dark:text-green-500">
                    {formatCurrency(stats.revenueByStatus.delivered)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">تم الشحن:</span>
                  <span className="text-base font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(stats.revenueByStatus.shipped)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">مؤكد:</span>
                  <span className="text-base font-semibold text-foreground">
                    {formatCurrency(stats.revenueByStatus.confirmed)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">قيد الانتظار:</span>
                  <span className="text-base font-semibold text-foreground">
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
          <CardTitle className="text-lg font-semibold text-foreground">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/merchant/products">
              <Button variant="outline" className="w-full h-11 text-base font-medium">
                إدارة المنتجات
              </Button>
            </Link>
            <Link href="/merchant/orders">
              <Button variant="outline" className="w-full h-11 text-base font-medium">
                عرض الطلبات
              </Button>
            </Link>
            <Link href="/merchant/settings">
              <Button variant="outline" className="w-full h-11 text-base font-medium">
                إعدادات المتجر
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

