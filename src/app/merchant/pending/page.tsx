'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { axiosInstance } from '@/lib/axiosInstance'
import { Button } from '@/components/ui/button'
import logger from '@/lib/logger'

interface Merchant {
  _id: string
  businessName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  rejectionReason?: string
  suspensionReason?: string
  suspendedAt?: string
  appliedAt: string
}

export default function MerchantPending() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    const checkMerchantStatus = async () => {
      try {
        const token = await getToken()
        const response = await axiosInstance.get('/merchants/my-status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.data.hasApplication) {
          const merchantData = response.data.merchant
          // Normalize status to uppercase
          const normalizedStatus = merchantData.status?.toUpperCase()
          const normalizedMerchant = {
            ...merchantData,
            status: normalizedStatus as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
          }
          setMerchant(normalizedMerchant)
          
          // If merchant is approved, redirect to dashboard
          if (normalizedStatus === 'APPROVED') {
            router.push('/merchant/dashboard')
            return
          }
        } else {
          // No application found, redirect to apply
          router.push('/merchant/apply')
          return
        }
      } catch (error: any) {
        logger.error('Error checking merchant status', { 
          error: error instanceof Error ? error.message : String(error),
          status: error.response?.status 
        })
        if (error.response?.status === 404) {
          router.push('/merchant/apply')
          return
        }
      } finally {
        setLoading(false)
      }
    }

    checkMerchantStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, router])

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-background to-muted/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <div className="text-lg font-medium">جاري التحميل...</div>
        <div className="text-sm text-muted-foreground mt-2">يرجى الانتظار</div>
      </div>
    )
  }

  if (!merchant) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Normalize status for comparison
  const normalizedStatus = merchant.status?.toUpperCase()

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-2xl w-full py-8">
        {normalizedStatus === 'PENDING' && (
          <div className="rounded-xl border bg-card p-8 sm:p-10 text-center shadow-lg">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-6 animate-pulse">
                <svg
                  className="w-10 h-10 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3 text-foreground">الطلب قيد المراجعة</h1>
            <div className="space-y-4 mb-6">
              <p className="text-lg text-muted-foreground">
                طلب التاجر الخاص بك لـ <span className="font-semibold text-foreground">{merchant.businessName}</span> قيد المراجعة حالياً من قبل فريقنا.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⏱️ المدة المتوقعة:</strong> عادة ما يستغرق هذا 1-2 يوم عمل. سنخطرك بمجرد معالجة طلبك.
                </p>
              </div>
            </div>
            <div className="border-t pt-6 mt-6">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>تاريخ التقديم: {formatDate(merchant.appliedAt)}</span>
              </div>
            </div>
          </div>
        )}

        {normalizedStatus === 'REJECTED' && (
          <div className="rounded-xl border bg-card p-8 sm:p-10 text-center shadow-lg">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-red-600 dark:text-red-400"
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
            </div>
            <h1 className="text-3xl font-bold mb-3 text-foreground">تم رفض الطلب</h1>
            <p className="text-lg text-muted-foreground mb-6">
              للأسف، تم رفض طلب التاجر الخاص بك لـ <span className="font-semibold text-foreground">{merchant.businessName}</span>.
            </p>
            {merchant.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-5 mb-6 text-right">
                <p className="text-sm font-semibold mb-2 text-red-900 dark:text-red-200">سبب الرفض:</p>
                <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">{merchant.rejectionReason}</p>
              </div>
            )}
            <div className="space-y-4">
              <Button
                onClick={() => router.push('/merchant/apply')}
                className="w-full sm:w-auto px-8"
                size="lg"
              >
                التقديم مرة أخرى
              </Button>
              <p className="text-xs text-muted-foreground">
                يمكنك مراجعة المعلومات المقدمة وتقديم طلب جديد
              </p>
            </div>
          </div>
        )}

        {normalizedStatus === 'SUSPENDED' && (
          <div className="rounded-xl border bg-card p-8 sm:p-10 text-center shadow-lg">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3 text-foreground">تم تعليق حسابك التجاري</h1>
            <p className="text-lg text-muted-foreground mb-6">
              حسابك التجاري <span className="font-semibold text-foreground">{merchant.businessName || 'غير محدد'}</span> تم تعليقه مؤقتاً.
            </p>
            {merchant.suspensionReason && (
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-5 mb-6 text-right">
                <p className="text-sm font-semibold mb-2 text-orange-900 dark:text-orange-200">سبب التعليق:</p>
                <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">{merchant.suspensionReason}</p>
              </div>
            )}
            {!merchant.suspensionReason && (
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-5 mb-6 text-right">
                <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                  لم يتم تحديد سبب التعليق. يرجى التواصل مع الإدارة للاستفسار.
                </p>
              </div>
            )}
            {merchant.suspendedAt && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  تاريخ التعليق: {formatDate(merchant.suspendedAt)}
                </p>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-right">
              <p className="text-sm font-medium mb-2 text-foreground">ما الذي يعنيه هذا:</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-none text-right">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                  <span>لن تتمكن من إضافة أو تعديل المنتجات</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                  <span>لن تتمكن من إدارة الطلبات</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                  <span>سيتم إخفاء منتجاتك مؤقتاً من الموقع</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                إذا كان لديك أي استفسارات، يرجى التواصل معنا
              </p>
            </div>
          </div>
        )}

        {/* Fallback for unknown status */}
        {normalizedStatus !== 'PENDING' && normalizedStatus !== 'REJECTED' && normalizedStatus !== 'SUSPENDED' && (
          <div className="rounded-xl border bg-card p-8 sm:p-10 text-center shadow-lg">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3 text-foreground">حالة غير معروفة</h1>
            <p className="text-lg text-muted-foreground mb-6">
              حالة حسابك التجاري: <span className="font-semibold text-foreground">{merchant.status}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              يرجى التواصل مع الإدارة للاستفسار عن حالة حسابك.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

