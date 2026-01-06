'use client'

/**
 * Simple component to check if Clerk key is available in the client bundle
 * This helps diagnose if NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY was embedded during build
 */
export function ClerkKeyChecker() {
  if (typeof window === 'undefined') {
    return null
  }

  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  // Only log in development or if there's an issue
  if (process.env.NODE_ENV === 'development' || !key) {
    console.log('🔑 Clerk Key Check:', {
      present: !!key,
      length: key?.length || 0,
      startsWithPk: key?.startsWith('pk_') || false,
      preview: key ? `${key.substring(0, 10)}...` : 'undefined',
      // This will be undefined if the variable wasn't set at build time
      isBuildTimeEmbedded: key !== undefined,
    })
  }

  return null
}

