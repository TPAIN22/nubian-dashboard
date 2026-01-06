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
    if (!publishableKey || publishableKey.trim() === '') {
      errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or empty')
      errors.push('⚠️ This variable MUST be set during build time, not runtime!')
    } else if (publishableKey.includes('your_key') || publishableKey.includes('pk_test_') && process.env.NODE_ENV === 'production') {
      errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY appears to be a placeholder or test key')
      errors.push('⚠️ In production, use your production publishable key (pk_live_...)')
    } else {
      // Validate key format
      if (!publishableKey.startsWith('pk_')) {
        errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY format appears invalid (should start with pk_)')
      }
    }

    // Check if Clerk scripts are loaded
    const clerkScriptLoaded = typeof window !== 'undefined' && 
      (window as any).Clerk !== undefined

    if (!clerkScriptLoaded && !isLoaded) {
      errors.push('Clerk JavaScript SDK is not loaded. Check network tab for failed requests.')
      
      // Additional diagnostics
      if (typeof window !== 'undefined') {
        // Check if Clerk script tags exist in the DOM
        const clerkScripts = document.querySelectorAll('script[src*="clerk"]')
        if (clerkScripts.length === 0) {
          errors.push('No Clerk script tags found in DOM. This suggests the SDK never attempted to load.')
        } else {
          errors.push(`Found ${clerkScripts.length} Clerk script tag(s), but SDK object is not available.`)
          
          // Inspect the script tags to see what they're trying to load
          console.group('📜 Clerk Script Tags Found')
          clerkScripts.forEach((script, idx) => {
            const scriptElement = script as HTMLScriptElement
            console.log(`Script ${idx + 1}:`, scriptElement.src || 'Inline script')
            console.log('  - Async:', scriptElement.async)
            console.log('  - Defer:', scriptElement.defer)
            
            // Check if script has loaded by checking if it's in the DOM
            const scriptStatus = scriptElement.src ? 
              (document.querySelector(`script[src="${scriptElement.src}"]`) !== null ? 'In DOM' : 'Not found') : 
              'Inline script'
            console.log('  - Status:', scriptStatus)
            
            // Check if script has an error handler
            scriptElement.addEventListener('error', (e) => {
              console.error(`Script ${idx + 1} failed to load:`, scriptElement.src)
              errors.push(`Script tag ${idx + 1} failed: ${scriptElement.src}`)
            })
          })
          console.groupEnd()
          
          // Check if scripts are in a blocked state
          // For scripts, we check if they have src but the SDK object isn't available
          const blockedScripts = Array.from(clerkScripts).filter(script => {
            const scriptEl = script as HTMLScriptElement
            // If script has src but SDK isn't available, it might be blocked or failed
            return scriptEl.src && typeof (window as any).Clerk === 'undefined'
          })
          
          if (blockedScripts.length > 0) {
            console.warn('⚠️ Some Clerk scripts appear to be blocked or still loading')
            blockedScripts.forEach((script, idx) => {
              const scriptEl = script as HTMLScriptElement
              console.warn(`Blocked/Slow script ${idx + 1}:`, scriptEl.src)
            })
          }
        }
        
        // Check for network errors with detailed information
        const performanceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        const clerkResources = performanceEntries.filter(entry => 
          entry.name.includes('clerk') || entry.name.includes('clerk.accounts.dev') || entry.name.includes('clerk.com')
        )
        
        if (clerkResources.length > 0) {
          const failedResources: Array<{url: string, duration: number, size: number}> = []
          
          clerkResources.forEach(entry => {
            const resource = entry as PerformanceResourceTiming & { transferSize?: number, decodedBodySize?: number }
            // Check if resource failed (transferSize 0 or very small, or duration suggests failure)
            const transferSize = resource.transferSize || 0
            const decodedBodySize = resource.decodedBodySize || 0
            
            if (transferSize === 0 && decodedBodySize === 0 && resource.duration > 100) {
              failedResources.push({
                url: resource.name,
                duration: resource.duration,
                size: transferSize
              })
            }
          })
          
          if (failedResources.length > 0) {
            errors.push(`${failedResources.length} Clerk resource(s) failed to load.`)
            // Log detailed info about failed resources
            console.group('❌ Failed Clerk Resources')
            failedResources.forEach(resource => {
              console.error('Failed URL:', resource.url)
              console.error('Duration:', resource.duration, 'ms')
              console.error('Size:', resource.size, 'bytes')
            })
            console.groupEnd()
            
            // Check if it's a CSP issue
            const cspError = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
            if (cspError) {
              errors.push('CSP header detected. Verify next.config.ts allows Clerk domains.')
            }
          } else {
            // Resources loaded but SDK not available - might be initialization issue
            console.warn('⚠️ Clerk resources loaded but SDK object not available')
            console.log('Loaded Clerk resources:', clerkResources.map(r => r.name))
          }
        } else {
          errors.push('No Clerk resources found in network requests. SDK may not be initializing.')
        }
        
        // Check for captured Clerk errors
        const checkForClerkErrors = () => {
          if (typeof window !== 'undefined') {
            const clerkErrors = (window as any).__CLERK_ERRORS__ || []
            if (clerkErrors.length > 0) {
              errors.push(`Clerk initialization errors detected: ${clerkErrors.length}`)
              console.group('❌ Captured Clerk Errors')
              clerkErrors.forEach((error: string, idx: number) => {
                console.error(`${idx + 1}. ${error}`)
              })
              console.groupEnd()
            }
          }
        }
        
        // Check after a short delay to catch async initialization errors
        setTimeout(checkForClerkErrors, 2000)
      }
    }

    // Check for CSP violations
    if (typeof window !== 'undefined') {
      const cspError = sessionStorage.getItem('csp-violation')
      if (cspError) {
        errors.push(`CSP violation detected: ${cspError}`)
      }
    }

    setDiagnostics({
      publishableKey: publishableKey || null,
      clerkLoaded: isLoaded || clerkScriptLoaded,
      errors,
    })

    // Log diagnostics to console for debugging
    if (errors.length > 0 || !isLoaded) {
      console.group('🔍 Clerk Diagnostics')
      console.log('Publishable Key:', publishableKey ? `✅ Set (${publishableKey.substring(0, 15)}...)` : '❌ Missing')
      console.log('Key Format Valid:', publishableKey?.startsWith('pk_') ? '✅ Yes' : '❌ No')
      console.log('Clerk Loaded:', isLoaded ? '✅ Yes' : '❌ No')
      console.log('Window.Clerk Available:', typeof window !== 'undefined' && (window as any).Clerk ? '✅ Yes' : '❌ No')
      console.log('Script Tags Found:', clerkScripts.length)
      console.log('Network Resources:', clerkResources.length)
      console.log('Errors:', errors.length > 0 ? errors : 'None')
      
      // Additional helpful info
      if (publishableKey) {
        console.log('Key Type:', publishableKey.startsWith('pk_live_') ? 'Production' : publishableKey.startsWith('pk_test_') ? 'Test' : 'Unknown')
        console.log('Environment:', process.env.NODE_ENV)
      }
      
      console.groupEnd()
      
      // Provide actionable next steps
      if (!isLoaded && publishableKey) {
        console.group('💡 Next Steps')
        console.log('1. Open Network tab and filter by "clerk"')
        console.log('2. Look for failed requests (red status)')
        console.log('3. Check the failed request URL and status code')
        console.log('4. Verify the publishable key is correct in Clerk Dashboard')
        console.log('5. Check if CSP is blocking (look for CSP errors in console)')
        console.groupEnd()
      }
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

