'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { axiosInstance } from '@/lib/axiosInstance'
import { MerchantSidebarProvider } from './merchant-sidebar-provider'

interface MerchantStatus {
  hasApplication: boolean
  merchant?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  }
}

// Routes that don't need the sidebar (public merchant pages)
const NO_SIDEBAR_ROUTES = ['/merchant/apply', '/merchant/pending']

export function MerchantSidebarWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    // Don't show sidebar on apply/pending pages
    if (NO_SIDEBAR_ROUTES.includes(pathname)) {
      setLoading(false)
      return
    }

    const checkMerchantStatus = async () => {
      try {
        const response = await axiosInstance.get('/merchants/my-status')
        setMerchantStatus(response.data)
      } catch (error: any) {
        // If 404, no application exists
        if (error.response?.status === 404) {
          setMerchantStatus({ hasApplication: false })
        }
      } finally {
        setLoading(false)
      }
    }

    checkMerchantStatus()
  }, [isLoaded, pathname])

  // Show loading state
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    )
  }

  // Don't show sidebar on apply/pending pages
  if (NO_SIDEBAR_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  // If no application or not approved, don't show sidebar
  if (!merchantStatus?.hasApplication || merchantStatus.merchant?.status !== 'APPROVED') {
    return <>{children}</>
  }

  // Show sidebar only for approved merchants
  return <MerchantSidebarProvider>{children}</MerchantSidebarProvider>
}

