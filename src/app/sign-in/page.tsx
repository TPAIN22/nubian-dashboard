'use client'

import ModernNoubian from '@/components/nubian'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Only run this effect when user loads and we're on sign-in page
    if (!isLoaded || pathname !== '/sign-in') return
    
    // If user is signed in, redirect based on role
    if (user && !hasRedirected.current) {
      hasRedirected.current = true
      const role = user.publicMetadata?.role as string | undefined

      // Use window.location for a hard redirect to prevent loops
      // Add a small delay to ensure Clerk state is fully settled
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = '/business/dashboard'
        } else if (role === 'merchant') {
          window.location.href = '/merchant/dashboard'
        } else {
          // Regular users without special roles - redirect to home
          window.location.href = '/'
        }
      }, 100)
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

  // Not signed in - show sign-in page
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <SignIn 
        routing="path"
        path="/sign-in"
        afterSignInUrl="/sign-in"
        afterSignUpUrl="/sign-in"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg"
          }
        }}
      />
    </div>
  )
}
