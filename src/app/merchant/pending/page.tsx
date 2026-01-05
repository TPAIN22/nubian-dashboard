'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { axiosInstance } from '@/lib/axiosInstance'

interface Merchant {
  _id: string
  businessName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  appliedAt: string
}

export default function MerchantPending() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    const checkMerchantStatus = async () => {
      try {
        const response = await axiosInstance.get('/merchants/my-status')
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
        console.error('Error checking merchant status:', error)
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
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!merchant) {
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full rounded-lg border bg-card p-8 text-center">
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
            <h1 className="text-2xl font-bold mb-2">Application Under Review</h1>
            <p className="text-muted-foreground mb-4">
              Your merchant application for <strong>{merchant.businessName}</strong> is currently being reviewed by our team.
            </p>
            <p className="text-sm text-muted-foreground">
              We'll notify you once your application has been processed. This usually takes 1-2 business days.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Applied on: {new Date(merchant.appliedAt).toLocaleDateString()}
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
            <h1 className="text-2xl font-bold mb-2">Application Rejected</h1>
            <p className="text-muted-foreground mb-4">
              Unfortunately, your merchant application for <strong>{merchant.businessName}</strong> has been rejected.
            </p>
            {merchant.rejectionReason && (
              <div className="bg-muted p-4 rounded-lg mb-4 text-left">
                <p className="text-sm font-medium mb-2">Reason:</p>
                <p className="text-sm text-muted-foreground">{merchant.rejectionReason}</p>
              </div>
            )}
            <button
              onClick={() => router.push('/merchant/apply')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Apply Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

