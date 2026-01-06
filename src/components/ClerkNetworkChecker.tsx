'use client'

import { useEffect, useState } from 'react'

/**
 * Component to check Clerk network requests and provide detailed diagnostics
 */
export function ClerkNetworkChecker() {
  const [networkInfo, setNetworkInfo] = useState<{
    requests: Array<{ url: string; status: string; failed: boolean }>
    summary: string
  } | null>(null)

  useEffect(() => {
    // Wait a bit for network requests to complete
    const checkNetwork = () => {
      if (typeof window === 'undefined') return

      // Get all network entries
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      
      // Filter Clerk-related requests
      const clerkRequests = entries
        .filter(entry => 
          entry.name.includes('clerk') || 
          entry.name.includes('clerk.accounts.dev') || 
          entry.name.includes('clerk.com') ||
          entry.name.includes('clerk.dev')
        )
        .map(entry => {
          const resource = entry as PerformanceResourceTiming & { 
            transferSize?: number
            decodedBodySize?: number
            responseStatus?: number
          }
          
          const transferSize = resource.transferSize || 0
          const decodedBodySize = resource.decodedBodySize || 0
          const failed = transferSize === 0 && decodedBodySize === 0 && resource.duration > 100
          
          return {
            url: resource.name,
            status: failed ? 'FAILED' : 'SUCCESS',
            failed,
            duration: resource.duration,
            size: transferSize
          }
        })

      if (clerkRequests.length > 0) {
        const failedCount = clerkRequests.filter(r => r.failed).length
        const successCount = clerkRequests.length - failedCount
        
        setNetworkInfo({
          requests: clerkRequests.map(r => ({
            url: r.url,
            status: r.status,
            failed: r.failed
          })),
          summary: `${successCount} succeeded, ${failedCount} failed`
        })

        // Log detailed info
        console.group('🌐 Clerk Network Requests')
        clerkRequests.forEach(req => {
          if (req.failed) {
            console.error(`❌ FAILED: ${req.url}`)
            console.error(`   Duration: ${req.duration.toFixed(2)}ms`)
            console.error(`   Size: ${req.size} bytes`)
          } else {
            console.log(`✅ SUCCESS: ${req.url}`)
            console.log(`   Duration: ${req.duration.toFixed(2)}ms`)
            console.log(`   Size: ${req.size} bytes`)
          }
        })
        console.groupEnd()

        // If there are failures, provide specific guidance
        if (failedCount > 0) {
          const failedUrls = clerkRequests.filter(r => r.failed).map(r => r.url)
          console.group('🔧 Troubleshooting Failed Requests')
          console.log('Failed URLs:', failedUrls)
          console.log('Possible causes:')
          console.log('1. CSP blocking the request (check next.config.ts)')
          console.log('2. Network/firewall blocking Clerk CDN')
          console.log('3. Invalid publishable key causing script to fail')
          console.log('4. Ad blocker or browser extension interfering')
          console.log('5. Clerk CDN outage (check status.clerk.com)')
          console.groupEnd()
        }
      }
    }

    // Check immediately and after a delay
    checkNetwork()
    const timeout = setTimeout(checkNetwork, 3000)

    return () => clearTimeout(timeout)
  }, [])

  // Only show in development or if there are issues
  if (process.env.NODE_ENV === 'production' && networkInfo?.requests.every(r => !r.failed)) {
    return null
  }

  if (!networkInfo) {
    return null
  }

  const hasFailures = networkInfo.requests.some(r => r.failed)

  if (!hasFailures && process.env.NODE_ENV === 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 max-w-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-lg z-50">
      <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
        Clerk Network Status
      </h3>
      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
        {networkInfo.summary}
      </p>
      <details className="text-xs">
        <summary className="cursor-pointer text-blue-700 dark:text-blue-300 mb-1">
          View Details
        </summary>
        <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
          {networkInfo.requests.map((req, idx) => (
            <li key={idx} className={req.failed ? 'text-red-600 dark:text-red-400' : ''}>
              {req.status}: {req.url.substring(0, 60)}...
            </li>
          ))}
        </ul>
      </details>
      {hasFailures && (
        <p className="text-xs text-red-700 dark:text-red-300 mt-2">
          Check browser console for detailed troubleshooting steps.
        </p>
      )}
    </div>
  )
}

