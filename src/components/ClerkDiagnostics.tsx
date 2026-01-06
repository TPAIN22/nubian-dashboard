'use client'

import { useEffect, useState } from 'react'

/**
 * Client-side component to diagnose Clerk loading issues
 * This helps identify why Clerk might not be loading in production
 */
export function ClerkDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<{
    publishableKey: string | null
    clerkLoaded: boolean
    errors: string[]
  }>({
    publishableKey: null,
    clerkLoaded: false,
    errors: [],
  })
  const [clerkLoaded, setClerkLoaded] = useState(false)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    // Check if Clerk is loaded by checking for the global Clerk object
    const checkClerkLoaded = () => {
      if (typeof window !== 'undefined') {
        const loaded = (window as any).Clerk !== undefined
        setClerkLoaded(loaded)
        return loaded
      }
      return false
    }

    // Check immediately
    const isLoaded = checkClerkLoaded()

    // Also check periodically in case it loads later
    const interval = setInterval(() => {
      checkClerkLoaded()
    }, 1000)

    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    const errors: string[] = []

    // Check if publishable key is set
    if (!publishableKey || publishableKey.trim() === '' || publishableKey.includes('your_key')) {
      errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or invalid')
    }

    // Check if Clerk scripts are loaded
    const clerkScriptLoaded = typeof window !== 'undefined' && 
      (window as any).Clerk !== undefined

    if (!clerkScriptLoaded && !isLoaded) {
      errors.push('Clerk JavaScript SDK is not loaded. Check network tab for failed requests.')
    }

    // Check for CSP violations
    if (typeof window !== 'undefined') {
      const cspError = sessionStorage.getItem('csp-violation')
      if (cspError) {
        errors.push(`CSP violation detected: ${cspError}`)
      }
    }

    setDiagnostics({
      publishableKey,
      clerkLoaded: isLoaded || clerkScriptLoaded,
      errors,
    })

    // Log diagnostics to console for debugging
    if (errors.length > 0 || !isLoaded) {
      console.group('🔍 Clerk Diagnostics')
      console.log('Publishable Key:', publishableKey ? '✅ Set' : '❌ Missing')
      console.log('Clerk Loaded:', isLoaded ? '✅ Yes' : '❌ No')
      console.log('Errors:', errors.length > 0 ? errors : 'None')
      console.groupEnd()
    }

    // In production, show error after 5 seconds if Clerk hasn't loaded
    if (process.env.NODE_ENV === 'production' && !isLoaded) {
      const timer = setTimeout(() => {
        if (!checkClerkLoaded()) {
          setShowError(true)
        }
      }, 5000)
      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    }

    return () => clearInterval(interval)
  }, [clerkLoaded])

  // Only show diagnostics in development or if there are errors
  // In production, only show if Clerk failed to load after timeout
  if (process.env.NODE_ENV === 'production') {
    if (diagnostics.errors.length === 0 && diagnostics.clerkLoaded) {
      return null
    }
    if (!showError && !diagnostics.errors.length) {
      return null
    }
  }

  // In development, don't show if everything is working
  if (process.env.NODE_ENV === 'development' && diagnostics.errors.length === 0 && diagnostics.clerkLoaded) {
    return null
  }

  // Show errors if any
  if (diagnostics.errors.length > 0) {
    return (
      <div className="fixed bottom-4 right-4 max-w-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg z-50">
        <h3 className="font-bold text-red-900 dark:text-red-100 mb-2">
          Clerk Configuration Issues
        </h3>
        <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-200 space-y-1">
          {diagnostics.errors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
        <p className="text-xs text-red-700 dark:text-red-300 mt-2">
          Check the console for more details. Ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set during build.
        </p>
      </div>
    )
  }

  return null
}

