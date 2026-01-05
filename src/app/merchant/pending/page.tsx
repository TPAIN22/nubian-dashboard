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
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
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
          setMerchant(merchantData)
          
          // If merchant is approved, redirect to dashboard
          if (merchantData.status === 'APPROVED') {
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
  }, [isLoaded, router])

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

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full rounded-lg border bg-card p-8 text-center shadow-sm">
        {merchant.status === 'PENDING' && (
          <>
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
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
            <h1 className="text-2xl font-bold mb-2">الطلب قيد المراجعة</h1>
            <p className="text-muted-foreground mb-4">
              طلب التاجر الخاص بك لـ <strong>{merchant.businessName}</strong> قيد المراجعة حالياً من قبل فريقنا.
            </p>
            <p className="text-sm text-muted-foreground">
              سنخطرك بمجرد معالجة طلبك. عادة ما يستغرق هذا 1-2 يوم عمل.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              تاريخ التقديم: {new Date(merchant.appliedAt).toLocaleDateString('ar-SA')}
            </p>
          </>
        )}

        {merchant.status === 'REJECTED' && (
          <>
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
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
            <h1 className="text-2xl font-bold mb-2">تم رفض الطلب</h1>
            <p className="text-muted-foreground mb-4">
              للأسف، تم رفض طلب التاجر الخاص بك لـ <strong>{merchant.businessName}</strong>.
            </p>
            {merchant.rejectionReason && (
              <div className="bg-muted p-4 rounded-lg mb-4 text-right">
                <p className="text-sm font-medium mb-2">السبب:</p>
                <p className="text-sm text-muted-foreground">{merchant.rejectionReason}</p>
              </div>
            )}
            <Button
              onClick={() => router.push('/merchant/apply')}
              className="mt-4"
            >
              التقديم مرة أخرى
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

