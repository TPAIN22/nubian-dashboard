'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Component that redirects authenticated users based on their role
 * - Admin → /business/dashboard
 * - Merchant → /merchant/dashboard
 * - No role or other → stays on current page (usually home)
 */
export default function RoleBasedRedirect() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Only redirect if Clerk is loaded and user is authenticated
    if (!isLoaded || !user) {
      return
    }

    // Don't redirect if already redirected or if we're already on a dashboard page
    if (hasRedirected.current) {
      return
    }

    // Don't redirect if already on a protected route
    if (pathname?.startsWith('/business/') || pathname?.startsWith('/merchant/')) {
      return
    }

    // Don't redirect from sign-in or sign-up pages (they handle their own redirects)
    if (pathname === '/sign-in' || pathname === '/sign-up') {
      return
    }

    const role = user.publicMetadata?.role as string | undefined

    // Only redirect if user has a role (admin or merchant)
    // Regular users without roles stay on the current page
    if (role === 'admin') {
      hasRedirected.current = true
      router.replace('/business/dashboard')
    } else if (role === 'merchant') {
      hasRedirected.current = true
      router.replace('/merchant/dashboard')
    }
    // No role or other role - stay on current page (home page)
  }, [isLoaded, user, router, pathname])

  // This component doesn't render anything
  return null
}

