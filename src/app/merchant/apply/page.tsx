'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { axiosInstance } from '@/lib/axiosInstance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import logger from '@/lib/logger'
import { 
  Building2, 
  Mail, 
  Phone, 
  FileText, 
  MapPin, 
  CheckCircle2,
  Store,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react'

interface Merchant {
  _id: string
  businessName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  appliedAt: string
}

export const runtime = 'edge';


export default function MerchantApply() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessEmail: user?.primaryEmailAddress?.emailAddress || '',
    businessPhone: '',
    businessAddress: '',
  })

  useEffect(() => {
    if (!isLoaded) return

    const checkExistingApplication = async () => {
      try {
        const token = await getToken()
        if (!token) {
          setChecking(false)
          return
        }
        
        const response = await axiosInstance.get('/merchants/my-status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        // Handle standardized response format: { success: true, data: { merchant, hasApplication }, message: "..." }
        const responseData = response.data?.data || response.data
        if (responseData.hasApplication) {
          const merchantData = responseData.merchant
          setMerchant(merchantData)
          if (merchantData.status === 'APPROVED') {
            // Use replace to avoid adding to history and prevent redirect loops
            router.replace('/merchant/dashboard')
          } else {
            setSubmitted(true)
          }
          return
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          logger.error('Error checking merchant status', { 
            error: error instanceof Error ? error.message : String(error),
            status: error.response?.status 
          })
        }
      } finally {
        setChecking(false)
      }
    }

    checkExistingApplication()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.businessName || !formData.businessEmail) {
        toast.error('يرجى ملء جميع الحقول المطلوبة')
        setLoading(false)
        return
      }

      const token = await getToken()
      
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        setLoading(false)
        return
      }

      logger.debug('Submitting application', { 
        businessName: formData.businessName,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'Not configured'
      })
      
      const response = await axiosInstance.post('/merchants/apply', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      // Handle standardized response format: { success: true, data: merchant, message: "..." }
      const responseData = response.data?.data || response.data
      logger.info('Application submitted successfully', { merchantId: responseData?._id })
      toast.success('تم إرسال الطلب بنجاح!')
      
      // Fetch the merchant status to display
      try {
        const statusResponse = await axiosInstance.get('/merchants/my-status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        // Handle standardized response format: { success: true, data: { merchant, hasApplication }, message: "..." }
        const statusData = statusResponse.data?.data || statusResponse.data
        if (statusData.hasApplication) {
          setMerchant(statusData.merchant)
          setSubmitted(true)
        } else {
          // Application was submitted but status endpoint doesn't return it yet
          // Set submitted to true to show success state
          setSubmitted(true)
        }
      } catch (statusError) {
        logger.error('Error fetching status after submission', { 
          error: statusError instanceof Error ? statusError.message : String(statusError) 
        })
        // Application was successfully submitted, show success state even if status fetch fails
        // Create a minimal merchant object from the POST response if available
        if (responseData?._id) {
          setMerchant({
            _id: responseData._id,
            businessName: formData.businessName,
            status: 'PENDING',
            appliedAt: new Date().toISOString(),
          })
        }
        setSubmitted(true)
      }
    } catch (error: any) {
      logger.error('Error submitting application', { 
        error: error instanceof Error ? error.message : String(error),
        status: error.response?.status,
        responseData: error.response?.data
      })
      
      // More detailed error messages - Handle standardized error format: { success: false, error: { message, code } }
      const errorData = error.response?.data
      const errorMessage = errorData?.error?.message || errorData?.message || null
      
      if (error.response?.status === 401) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
      } else if (error.response?.status === 400) {
        toast.error(errorMessage || 'بيانات الطلب غير صحيحة. يرجى التحقق من معلوماتك.')
      } else if (error.response?.status === 409 || errorMessage?.includes('already')) {
        toast.error('لديك بالفعل طلب تاجر. يرجى التحقق من حالة طلبك.')
        router.push('/merchant/pending')
      } else if (errorMessage) {
        toast.error(errorMessage)
      } else if (error.request) {
        // Network error - no response received
        logger.error('Network error details', {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
        })
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiUrl) {
          toast.error('خادم API غير مُكوّن. يرجى تعيين NEXT_PUBLIC_API_URL في ملف .env.local')
        } else {
          const fullUrl = `${apiUrl}/merchants/apply`
          toast.error(
            `خطأ في الشبكة: لا يمكن الاتصال بخادم API على ${fullUrl}. ` +
            `يرجى التأكد من: 1) تشغيل الخادم الخلفي، 2) صحة عنوان API في .env.local`
          )
        }
      } else {
        toast.error('فشل إرسال الطلب. يرجى المحاولة مرة أخرى.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-background dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <div className="text-lg text-foreground">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  // Show status if application was submitted (even if merchant data fetch failed)
  if (submitted) {
    // If merchant data is not available, show a generic success message
    if (!merchant) {
      return (
        <div className="w-full bg-background dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative w-24 h-24 rounded-full p-3 shadow-lg ring-4 ring-amber-100 dark:ring-amber-900/30">
                  <Image 
                    src="/logo.png" 
                    alt="Nubian Logo" 
                    width={80} 
                    height={80} 
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                تم إرسال الطلب بنجاح!
              </h1>
            </div>

            <div className="rounded-xl shadow-xl border border-border bg-card p-8 md:p-10">
              <div className="text-center mb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">تم استلام طلبك</h2>
                <p className="text-muted-foreground text-lg">
                  تم إرسال طلب التاجر الخاص بك بنجاح. سيقوم فريقنا بمراجعته خلال 1-2 يوم عمل.
                </p>
              </div>
              
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">ماذا يحدث بعد ذلك؟</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li>• سيقوم فريقنا بمراجعة طلبك خلال 1-2 يوم عمل</li>
                      <li>• سنخطرك عبر البريد الإلكتروني بمجرد معالجة طلبك</li>
                      <li>• يمكنك التحقق من حالة طلبك من خلال زيارة هذه الصفحة مرة أخرى</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="px-6"
                >
                  العودة للرئيسية
                </Button>
                <Button
                  onClick={() => {
                    setSubmitted(false)
                    setMerchant(null)
                    // Reload the page to check status
                    window.location.reload()
                  }}
                  className="px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  التحقق من الحالة
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Show detailed status if merchant data is available
    return (
      <div className="w-full bg-background dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header Section with Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 rounded-full p-3 shadow-lg ring-4 ring-amber-100 dark:ring-amber-900/30">
                <Image 
                  src="/logo.png" 
                  alt="Nubian Logo" 
                  width={80} 
                  height={80} 
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              حالة الطلب
            </h1>
          </div>

          {/* Status Display */}
          <div className="rounded-xl shadow-xl border border-border bg-card p-8 md:p-10">
            {merchant.status === 'PENDING' && (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-20 h-20 rounded-full bg-warning/10 dark:bg-warning/20 flex items-center justify-center mb-4">
                    <Clock className="w-10 h-10 text-warning" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">الطلب قيد المراجعة</h2>
                  <p className="text-muted-foreground text-lg">
                    طلب التاجر الخاص بك لـ <strong className="text-foreground">{merchant.businessName}</strong> قيد المراجعة حالياً من قبل فريقنا.
                  </p>
                </div>
                
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">ماذا يحدث بعد ذلك؟</h3>
                      <ul className="space-y-2 text-muted-foreground text-sm">
                        <li>• سيقوم فريقنا بمراجعة طلبك خلال 1-2 يوم عمل</li>
                        <li>• سنخطرك عبر البريد الإلكتروني بمجرد معالجة طلبك</li>
                        <li>• يمكنك التحقق من حالة طلبك هنا في أي وقت</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">اسم العمل</p>
                      <p className="font-medium text-foreground">{merchant.businessName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">تاريخ التقديم</p>
                      <p className="font-medium text-foreground">
                        {new Date(merchant.appliedAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {merchant.status === 'REJECTED' && (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center mb-4">
                    <svg
                      className="w-10 h-10 text-destructive"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">تم رفض الطلب</h2>
                  <p className="text-muted-foreground text-lg">
                    للأسف، تم رفض طلب التاجر الخاص بك لـ <strong className="text-foreground">{merchant.businessName}</strong>.
                  </p>
                </div>

                {merchant.rejectionReason && (
                  <div className="bg-destructive/5 dark:bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      سبب الرفض
                    </h3>
                    <p className="text-foreground">{merchant.rejectionReason}</p>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => {
                      setSubmitted(false)
                      setMerchant(null)
                      setFormData({
                        businessName: '',
                        businessDescription: '',
                        businessEmail: user?.primaryEmailAddress?.emailAddress || '',
                        businessPhone: '',
                        businessAddress: '',
                      })
                    }}
                    variant="outline"
                    className="px-6"
                  >
                    تعديل الطلب
                  </Button>
                  <Button
                    onClick={() => router.push('/merchant/apply')}
                    className="px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    التقديم مرة أخرى
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-background dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section with Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24 rounded-full p-3 shadow-lg ring-4 ring-amber-100 dark:ring-amber-900/30">
              <Image 
                src="/logo.png" 
                alt="Nubian Logo" 
                width={80} 
                height={80} 
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            كن تاجراً في نوبيان
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            انضم إلى آلاف التجار الناجحين الذين يبيعون على نوبيان. نمّي عملك ووصل إلى ملايين العملاء.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Benefits Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl shadow-lg p-6 border border-border bg-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">لماذا تنضم إلى نوبيان؟</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">متجرك الخاص</h3>
                    <p className="text-sm text-muted-foreground">أنشئ واجهة متجرك وعرض منتجاتك</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">نمّي مبيعاتك</h3>
                    <p className="text-sm text-muted-foreground">وصل إلى ملايين العملاء وزد إيراداتك</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">منصة آمنة</h3>
                    <p className="text-sm text-muted-foreground">معالجة دفع آمنة وموثوقة</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">موافقة سريعة</h3>
                    <p className="text-sm text-muted-foreground">احصل على الموافقة خلال 1-2 يوم عمل</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-2">جاهز للبدء؟</h3>
              <p className="text-sm opacity-90 mb-4">
                املأ نموذج الطلب وسيقوم فريقنا بمراجعته بسرعة. نحن هنا لمساعدتك على النجاح!
              </p>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>التقديم مجاني</span>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl shadow-xl border border-border bg-card p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">نموذج الطلب</h2>
                <p className="text-muted-foreground">
                  يرجى تقديم معلومات دقيقة عن عملك. جميع الحقول المميزة بـ * مطلوبة.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-foreground font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    اسم العمل *
                  </Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                    placeholder="أدخل اسم عملك"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail" className="text-foreground font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-500" />
                    البريد الإلكتروني للعمل *
                  </Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    required
                    placeholder="business@example.com"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPhone" className="text-foreground font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500" />
                    هاتف العمل
                  </Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    value={formData.businessPhone}
                    onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                    placeholder="+249123456789"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription" className="text-foreground font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    وصف العمل
                  </Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                    placeholder="أخبرنا عن عملك ومنتجاتك وما يميزك..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">ساعدنا على فهم عملك بشكل أفضل</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress" className="text-foreground font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    عنوان العمل
                  </Label>
                  <Textarea
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    placeholder="أدخل عنوان عملك"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري الإرسال...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        إرسال الطلب
                      </span>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    بالتقديم، أنت توافق على الشروط والأحكام. سنراجع طلبك خلال 1-2 يوم عمل.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

