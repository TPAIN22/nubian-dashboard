'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)
  const [clerkError, setClerkError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Clerk keys are configured (only on client side)
    if (typeof window !== 'undefined') {
      const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      if (!publishableKey || publishableKey.includes('your_key') || publishableKey.trim() === '') {
        setClerkError('Clerk is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local file.')
        console.error('❌ Clerk Error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or invalid')
        console.error('Current value:', publishableKey ? 'Set but invalid' : 'Not set')
        return
      }
      console.log('✅ Clerk publishable key is configured')
    }

    // Only run this effect when user loads and we're on sign-in page
    if (!isLoaded || pathname !== '/sign-in') return
    
    // If user is signed in, redirect based on role
    if (user && !hasRedirected.current) {
      hasRedirected.current = true
      
      // Wait a bit longer for role metadata to be fully loaded
      // This is especially important in production where metadata might take longer to sync
      const checkRoleAndRedirect = () => {
        const role = user.publicMetadata?.role as string | undefined

        // Use window.location for a hard redirect to prevent loops
        if (role === 'admin') {
          window.location.href = '/business/dashboard'
        } else if (role === 'merchant') {
          window.location.href = '/merchant/dashboard'
        } else {
          // Regular users without special roles - redirect to home
          // If role is undefined, still redirect to home to break the loop
          window.location.href = '/'
        }
      }
      
      // Try immediately first
      checkRoleAndRedirect()
      
      // Also set a timeout as fallback in case metadata is still loading
      // This helps in production where metadata sync might be slower
      setTimeout(checkRoleAndRedirect, 500)
    }
  }, [isLoaded, user, pathname])

  // Show loading while checking auth status
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // If user is signed in, show loading while redirecting
  // This covers all authenticated users (admin, merchant, or regular)
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
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
          afterSignInUrl="/"
          afterSignUpUrl="/"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "shadow-lg w-full",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-sm",
            }
          }}
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  )
}
