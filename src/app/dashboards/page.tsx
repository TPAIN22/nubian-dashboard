'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { axiosInstance } from '@/lib/axiosInstance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Store, 
  Shield, 
  TrendingUp, 
  Users, 
  Package, 
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function DashboardsPage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [merchantStatus, setMerchantStatus] = useState<{
    hasApplication: boolean
    merchant?: {
      status: 'PENDING' | 'APPROVED' | 'REJECTED'
    }
  } | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    const checkMerchantStatus = async () => {
      try {
        if (!user) {
          setChecking(false)
          return
        }

        const role = user.publicMetadata?.role as string | undefined
        
        if (role === 'merchant') {
          const token = await getToken()
          if (token) {
            try {
              const response = await axiosInstance.get('/merchants/my-status', {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              setMerchantStatus(response.data)
            } catch (error) {
              // If API call fails, just continue without merchant status
            }
          }
        }
      } catch (error) {
        // Ignore errors
      } finally {
        setChecking(false)
      }
    }

    checkMerchantStatus()
  }, [isLoaded, user, getToken])

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-lg text-muted-foreground">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  const role = user?.publicMetadata?.role as string | undefined
  const isAdmin = role === 'admin'
  const isMerchant = role === 'merchant'
  const isMerchantApproved = merchantStatus?.merchant?.status === 'APPROVED'

  const handleDashboardClick = async (dashboardType: 'admin' | 'merchant') => {
    if (dashboardType === 'admin') {
      router.push('/business/dashboard')
    } else if (dashboardType === 'merchant') {
      if (!user) {
        router.push('/sign-in')
        return
      }

      if (isMerchant && isMerchantApproved) {
        router.push('/merchant/dashboard')
      } else {
        router.push('/merchant/apply')
      }
    }
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">لوحات التحكم المتقدمة</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              لوحات التحكم
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              اختر لوحة التحكم المناسبة لإدارة عملك على منصة نوبيان
            </p>
          </div>
        </div>
      </section>

      {/* Dashboards Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Admin Dashboard Card */}
            {isAdmin && (
              <Card 
                className="group relative overflow-hidden border-2 hover:border-amber-500 transition-all duration-300 hover:shadow-2xl cursor-pointer bg-white"
                onClick={() => handleDashboardClick('admin')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">إدارة</span>
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground mb-2">لوحة تحكم الإدارة</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    إدارة شاملة لمنصة نوبيان - المنتجات، الطلبات، التجار، والإحصائيات
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-slate-500">المنتجات</p>
                        <p className="text-sm font-semibold text-slate-900">إدارة كاملة</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-slate-500">التجار</p>
                        <p className="text-sm font-semibold text-slate-900">مراقبة</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-slate-500">الإحصائيات</p>
                        <p className="text-sm font-semibold text-slate-900">تحليلات</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-slate-500">الأداء</p>
                        <p className="text-sm font-semibold text-slate-900">تقارير</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 h-12 text-base font-semibold"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDashboardClick('admin')
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <LayoutDashboard className="w-5 h-5" />
                        الدخول إلى لوحة التحكم
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Merchant Dashboard Card */}
            <Card 
              className={`group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl cursor-pointer bg-white ${
                isMerchantApproved 
                  ? 'hover:border-amber-500 border-amber-200' 
                  : 'hover:border-orange-500 border-orange-200'
              }`}
              onClick={() => handleDashboardClick('merchant')}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isMerchantApproved 
                  ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/5' 
                  : 'bg-gradient-to-br from-orange-500/5 to-red-500/5'
              }`}></div>
              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                    isMerchantApproved 
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                      : 'bg-gradient-to-br from-orange-500 to-red-600'
                  }`}>
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <div className={`px-3 py-1 rounded-full ${
                    isMerchantApproved 
                      ? 'bg-amber-100 dark:bg-amber-900/20' 
                      : 'bg-orange-100 dark:bg-orange-900/20'
                  }`}>
                    <span className={`text-xs font-semibold ${
                      isMerchantApproved 
                        ? 'text-amber-700 dark:text-amber-300' 
                        : 'text-orange-700 dark:text-orange-300'
                    }`}>
                      {isMerchantApproved ? 'موافق' : 'تاجر'}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-foreground mb-2">لوحة تحكم التاجر</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {isMerchantApproved 
                    ? 'إدارة متجرك، منتجاتك، طلباتك، وإحصائيات مبيعاتك'
                    : 'ابدأ رحلتك كتاجر على منصة نوبيان - قدم طلبك الآن'}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-6">
                {isMerchantApproved ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <Store className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-xs text-slate-500">المتجر</p>
                          <p className="text-sm font-semibold text-slate-900">إدارة كاملة</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <Package className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-xs text-slate-500">المنتجات</p>
                          <p className="text-sm font-semibold text-slate-900">إضافة وتعديل</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-xs text-slate-500">المبيعات</p>
                          <p className="text-sm font-semibold text-slate-900">تحليلات</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-xs text-slate-500">الأداء</p>
                          <p className="text-sm font-semibold text-slate-900">تقارير</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200">
                      <Button 
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 h-12 text-base font-semibold"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDashboardClick('merchant')
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <LayoutDashboard className="w-5 h-5" />
                          الدخول إلى لوحة التحكم
                        </span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-1">ابدأ رحلتك كتاجر</h3>
                          <p className="text-sm text-slate-600">
                            انضم إلى آلاف التجار الناجحين على منصة نوبيان. قدم طلبك الآن واحصل على الموافقة خلال 1-2 يوم عمل.
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-slate-600">تقديم مجاني</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-slate-600">موافقة سريعة</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-slate-600">دعم كامل</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-slate-600">أدوات متقدمة</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200">
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 h-12 text-base font-semibold"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDashboardClick('merchant')
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Store className="w-5 h-5" />
                          {user ? 'تقديم طلب تاجر' : 'تسجيل الدخول للبدء'}
                        </span>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">منصة موحدة</h3>
              <p className="text-sm text-slate-600">إدارة كل شيء من مكان واحد</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">أداء سريع</h3>
              <p className="text-sm text-slate-600">تجربة سلسة وسريعة</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">آمن ومحمي</h3>
              <p className="text-sm text-slate-600">حماية كاملة لبياناتك</p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                العودة إلى الصفحة الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

