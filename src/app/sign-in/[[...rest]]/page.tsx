'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  const { user, isLoaded } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const hasRedirected = useRef(false)
  const [clerkError, setClerkError] = useState<string | null>(null)
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null)
  const [clerkLoadError, setClerkLoadError] = useState<string | null>(null)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [redirectTimeoutWarning, setRedirectTimeoutWarning] = useState(false)

  useEffect(() => {
    // Check if Clerk keys are configured (only on client side)
    if (typeof window !== 'undefined') {
      const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      if (!publishableKey || publishableKey.includes('your_key') || publishableKey.trim() === '') {
        setClerkError('Clerk is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local file.')
        return
      }
      
      // Listen for Clerk load errors
      const handleClerkError = (event: ErrorEvent) => {
        if (event.message?.includes('Clerk') || event.message?.includes('clerk')) {
          setClerkLoadError('Failed to load Clerk. Please check your internet connection and try refreshing the page.')
        }
      }
      
      window.addEventListener('error', handleClerkError)
      
      return () => {
        window.removeEventListener('error', handleClerkError)
      }
    }
  }, [])

  // Helper function to determine redirect URL based on role
  const getRedirectUrl = (role: string | undefined): string => {
    if (role === 'admin') {
      return '/business/dashboard'
    } else if (role === 'merchant') {
      return '/merchant/dashboard'
    }
    // No role or other role - redirect to main site
    return '/'
  }

  useEffect(() => {
    // Only run this effect when user loads and we're on sign-in page or its sub-routes
    if (!isLoaded || !pathname.startsWith('/sign-in')) {
      return
    }
    
    // If user is signed in, redirect based on role
    // Redirect immediately to prevent race condition with Clerk's automatic redirect
    if (user && !hasRedirected.current) {
      hasRedirected.current = true
      const role = user.publicMetadata?.role as string | undefined
      const redirectUrl = getRedirectUrl(role)

      // Use Next.js router for better integration
      // Add a fallback timeout in case router doesn't work
      try {
        router.push(redirectUrl)
        
        // Fallback: if redirect doesn't happen within 2 seconds, use window.location
        const timeout = setTimeout(() => {
          window.location.href = redirectUrl
        }, 2000)
        
        setRedirectTimeout(timeout)
      } catch (error) {
        // Fallback to window.location
        window.location.href = redirectUrl
      }
    }
  }, [isLoaded, user, pathname, router])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout)
      }
    }
  }, [redirectTimeout])

  // Show loading while checking auth status with timeout
  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        setLoadingTimeout(true)
        setClerkLoadError('Clerk is taking too long to load. This might be due to network issues or configuration problems.')
      }
    }, 8000) // 8 second timeout (reduced from 10)

    return () => clearTimeout(timeout)
  }, [isLoaded])

  // If user is signed in, show loading while redirecting with timeout
  useEffect(() => {
    if (user && hasRedirected.current) {
      // Show warning if redirect takes too long
      const timeout = setTimeout(() => {
        setRedirectTimeoutWarning(true)
      }, 3000) // 3 second warning

      return () => clearTimeout(timeout)
    }
  }, [user])

  // Show Clerk load error if present
  if (clerkLoadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-4">Clerk Loading Error</h2>
          <p className="text-red-800 dark:text-red-200 mb-4">{clerkLoadError}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setClerkLoadError(null)
                setLoadingTimeout(false)
                window.location.reload()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                setClerkLoadError(null)
                setLoadingTimeout(false)
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg mb-2">Loading Clerk...</div>
        {loadingTimeout && (
          <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-4 max-w-md text-center px-4">
            Taking longer than expected. Please check your internet connection and try refreshing the page.
          </div>
        )}
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg mb-2">Redirecting...</div>
        {redirectTimeoutWarning && (
          <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-4 max-w-md text-center px-4">
            Redirect is taking longer than expected. 
            <button 
              onClick={() => {
                const role = user.publicMetadata?.role as string | undefined
                const redirectUrl = getRedirectUrl(role)
                window.location.href = redirectUrl
              }}
              className="underline ml-1"
            >
              Click here to continue
            </button>
          </div>
        )}
      </div>
    )
  }

  // Show error if Clerk is not configured
  if (clerkError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-4">Configuration Error</h2>
          <p className="text-red-800 dark:text-red-200 mb-4">{clerkError}</p>
          <p className="text-sm text-red-700 dark:text-red-300">
            Please check your .env.local file and ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set.
          </p>
        </div>
      </div>
    )
  }

  // Not signed in - show sign-in page
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <SignIn 
          routing="path"
          path="/sign-in"
          // Let our useEffect handle the redirect based on role
          // Don't set redirectUrl/afterSignInUrl to allow our custom logic to work
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "shadow-lg w-full",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-sm",
            }
          }}
        />
      </div>
    </div>
  )
}
