'use client'

import { SignUp, useUser } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AuthShell } from '@/components/auth/AuthShell'
import { nubianClerkAppearance } from '@/components/auth/clerkAppearance'

/**
 * Sign-up mirrors the sign-in page's resilience patterns:
 *  - Detects missing/invalid Clerk publishable key on the client
 *  - Surfaces a friendly error if Clerk fails to load
 *  - On successful sign-up, role-based redirect (new accounts have no role yet,
 *    so we send them to the homepage; admin/merchant elevation happens later
 *    via Clerk publicMetadata)
 */
export default function SignUpPage() {
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
    if (typeof window !== 'undefined') {
      const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      if (!publishableKey || publishableKey.includes('your_key') || publishableKey.trim() === '') {
        setClerkError('Clerk is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local file.')
        return
      }

      const handleClerkError = (event: ErrorEvent) => {
        if (event.message?.includes('Clerk') || event.message?.includes('clerk')) {
          setClerkLoadError('Failed to load Clerk. Please check your internet connection and try refreshing the page.')
        }
      }

      window.addEventListener('error', handleClerkError)
      return () => window.removeEventListener('error', handleClerkError)
    }
  }, [])

  const getRedirectUrl = (role: string | undefined): string => {
    if (role === 'admin') return '/admin'
    if (role === 'merchant') return '/merchant/dashboard'
    return '/'
  }

  useEffect(() => {
    if (!isLoaded || !pathname.startsWith('/sign-up')) return

    if (user && !hasRedirected.current) {
      hasRedirected.current = true
      const role = user.publicMetadata?.role as string | undefined
      const redirectUrl = getRedirectUrl(role)

      try {
        router.push(redirectUrl)
        const timeout = setTimeout(() => {
          window.location.href = redirectUrl
        }, 2000)
        setRedirectTimeout(timeout)
      } catch {
        window.location.href = redirectUrl
      }
    }
  }, [isLoaded, user, pathname, router])

  useEffect(() => {
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout)
    }
  }, [redirectTimeout])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        setLoadingTimeout(true)
        setClerkLoadError('Clerk is taking too long to load. This might be due to network issues or configuration problems.')
      }
    }, 8000)
    return () => clearTimeout(timeout)
  }, [isLoaded])

  useEffect(() => {
    if (user && hasRedirected.current) {
      const timeout = setTimeout(() => {
        setRedirectTimeoutWarning(true)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [user])

  if (clerkLoadError) {
    return (
      <AuthShell mode="signup">
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-right">
          <h3 className="text-base font-bold text-destructive mb-2">تعذّر تحميل Clerk</h3>
          <p className="text-sm text-destructive/90 mb-4">{clerkLoadError}</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setClerkLoadError(null)
                setLoadingTimeout(false)
                window.location.reload()
              }}
              className="h-11 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 touch-manipulation"
            >
              تحديث الصفحة
            </button>
            <button
              type="button"
              onClick={() => {
                setClerkLoadError(null)
                setLoadingTimeout(false)
              }}
              className="h-11 rounded-full border border-border bg-card text-foreground font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 touch-manipulation"
            >
              المحاولة مرة أخرى
            </button>
          </div>
        </div>
      </AuthShell>
    )
  }

  if (!isLoaded) {
    return (
      <AuthShell mode="signup">
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-10">
          <div aria-hidden="true" className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin motion-reduce:animate-none" />
          <p className="mt-4 text-sm text-muted-foreground">جاري التحميل…</p>
          {loadingTimeout && (
            <p className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 max-w-xs text-center">
              يستغرق الأمر وقتاً أطول من المعتاد. تحقّق من اتصالك أو حاول التحديث.
            </p>
          )}
        </div>
      </AuthShell>
    )
  }

  if (user) {
    return (
      <AuthShell mode="signup">
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-10">
          <div aria-hidden="true" className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin motion-reduce:animate-none" />
          <p className="mt-4 text-sm text-muted-foreground">جاري إعادة التوجيه…</p>
          {redirectTimeoutWarning && (
            <p className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 max-w-xs text-center">
              التحويل يستغرق وقتاً أطول.{' '}
              <button
                type="button"
                onClick={() => {
                  const role = user.publicMetadata?.role as string | undefined
                  const redirectUrl = getRedirectUrl(role)
                  window.location.href = redirectUrl
                }}
                className="underline font-semibold rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 touch-manipulation"
              >
                اضغط للمتابعة
              </button>
            </p>
          )}
        </div>
      </AuthShell>
    )
  }

  if (clerkError) {
    return (
      <AuthShell mode="signup">
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-right">
          <h3 className="text-base font-bold text-destructive mb-2">خطأ في الإعداد</h3>
          <p className="text-sm text-destructive/90 mb-3">{clerkError}</p>
          <p className="text-xs text-destructive/80">
            تأكّد من ضبط <code translate="no" className="font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> في ملف <code translate="no" className="font-mono">.env.local</code>.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell mode="signup">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={nubianClerkAppearance}
      />
    </AuthShell>
  )
}
