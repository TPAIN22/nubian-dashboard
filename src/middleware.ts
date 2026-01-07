import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Type definitions
type UserRole = 'admin' | 'merchant' | undefined

interface ClerkPublicMetadata {
  role?: UserRole
}

// Configuration
const DEBUG = process.env.NODE_ENV === 'development'
const ROLE_CACHE_TTL = 60000 // 1 minute
const roleCheckCache = new Map<string, { role: UserRole; timestamp: number }>()

// Route matchers
const isPublicRoute = createRouteMatcher([
  '/', // Home page - public for SEO
  '/sign-in(.*)',
  '/about',
  '/contact',
  '/privacy-policy',
  '/exchange-policy',
  '/api/ping',
  '/api/user-check',
  '/debug-role',
  '/sitemap.xml',
  '/robots.txt',
  '/terms-conditions',
  '/sign-up(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/business(.*)',
])

const isMerchantRoute = createRouteMatcher([
  '/merchant(.*)',
])

// Utility functions
const logSecurityEvent = (event: string, details: Record<string, any>) => {
  // Security events logged silently
}

const debugLog = (message: string, data: Record<string, any>) => {
  // Debug logs disabled
}

const redirectByRole = (role: UserRole, req: Request) => {
  const redirectMap: Record<string, string> = {
    admin: '/business/dashboard',
    merchant: '/merchant/dashboard',
  }
  
  const redirectUrl = redirectMap[role || ''] || '/'
  return NextResponse.redirect(new URL(redirectUrl, req.url))
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname
  const userAgent = req.headers.get('user-agent') || ''
  
  // Detect search engine bots (Googlebot, Bingbot, etc.)
  const isSearchEngineBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebookexternalhit|ia_archiver|msnbot|ahrefsbot|semrushbot|dotbot|mj12bot/i.test(userAgent)
  
  // Skip middleware for Next.js internal paths and static files
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|otf)$/.test(pathname)
  ) {
    return NextResponse.next()
  }
  
  // Allow search engine bots to access public routes without authentication
  // This ensures proper crawling and indexing
  if (isSearchEngineBot && isPublicRoute(req)) {
    debugLog('Search engine bot accessing public route', { pathname, userAgent })
    const response = NextResponse.next()
    // Add headers to indicate this is a bot request
    response.headers.set('x-bot-request', 'true')
    return response
  }
  
  // Handle public routes (including root route) - no auth needed
  if (isPublicRoute(req)) {
    debugLog('Public route accessed', { pathname })
    return NextResponse.next()
  }
  
  // Get auth data
  let userId: string | null
  let sessionClaims: any
  
  try {
    const authResult = await auth()
    userId = authResult.userId
    sessionClaims = authResult.sessionClaims
  } catch (error) {
    // For API routes, let them handle their own authentication errors (return JSON)
    // For page routes, redirect to sign-in
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    const response = NextResponse.redirect(new URL('/sign-in', req.url))
    response.cookies.delete('__session')
    return response
  }
  
  if (!userId) {
    debugLog('Unauthenticated user redirected', { pathname })
    // For API routes, let them handle their own authentication errors (return JSON)
    // For page routes, redirect to sign-in
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    // Only redirect to sign-in if not already there to prevent loops
    if (pathname !== '/sign-in') {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    return NextResponse.next()
  }

  // Helper function to get user role (only called when needed)
  const getUserRole = async (): Promise<UserRole> => {
    // Check cache first
    const cached = roleCheckCache.get(userId!)
    if (cached && Date.now() - cached.timestamp < ROLE_CACHE_TTL) {
      debugLog('Role retrieved from cache', { userId, role: cached.role })
      return cached.role
    }
    
    // Try sessionClaims first (faster, if available)
    let role = (sessionClaims?.publicMetadata as ClerkPublicMetadata)?.role
    
    // If role not in sessionClaims, fetch from Clerk API
    if (role === undefined) {
      try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId!)
        role = (user.publicMetadata as ClerkPublicMetadata)?.role
        debugLog('Role fetched from Clerk API', { userId, role })
      } catch (error: any) {
        return undefined
      }
    }
    
    // Cache the role
    roleCheckCache.set(userId!, { role, timestamp: Date.now() })
    return role
  }

  // Check admin routes
  // Match backend logic exactly: src/middleware/auth.middleware.js
  // Backend uses: user.publicMetadata.role !== 'admin' (strict check)
  if (isAdminRoute(req)) {
    try {
      const role = await getUserRole()
      
      debugLog('Admin route access check', { userId, role, pathname })
      
      // Match backend check exactly: user.publicMetadata.role !== 'admin'
      // Backend uses strict !== (not case-insensitive)
      if (role !== 'admin') {
        logSecurityEvent('Unauthorized admin access attempt', {
          userId,
          pathname,
          role: role || 'none',
        })
        
        // Redirect non-admins away from admin routes to their appropriate dashboard
        const response = redirectByRole(role, req)
        response.headers.set('x-redirect-reason', 'not-admin')
        return response
      }
      
      // Admin access granted
      const response = NextResponse.next()
      response.headers.set('x-user-role', 'admin')
      response.headers.set('x-auth-checked', 'true')
      return response
      
    } catch (error: any) {
      logSecurityEvent('Admin route check failed', {
        userId,
        pathname,
        error: error.message,
      })
      
      // On error, try to get role from sessionClaims (already available, no API call needed)
      const role = (sessionClaims?.publicMetadata as ClerkPublicMetadata)?.role
      
      if (role) {
        // Redirect to appropriate dashboard based on role
        return redirectByRole(role, req)
      }
      
      // No role available - redirect to sign in
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  // Check merchant routes
  if (isMerchantRoute(req)) {
    // Allow /merchant/apply and /merchant/pending for all authenticated users
    // These pages will handle their own logic
    if (pathname === '/merchant/apply' || pathname === '/merchant/pending') {
      debugLog('Merchant application page accessed', { pathname, userId })
      return NextResponse.next()
    }
    
    try {
      const role = await getUserRole()
      
      debugLog('Merchant route access check', { userId, role, pathname })
      
      // Be explicit about each case
      if (role === 'merchant') {
        // Authorized merchant access
        const response = NextResponse.next()
        response.headers.set('x-user-role', 'merchant')
        response.headers.set('x-auth-checked', 'true')
        return response
      }
      
      if (role === undefined) {
        // Role could not be determined
        logSecurityEvent('Undefined role on merchant access', {
          userId,
          pathname,
        })
        
        // Allow through and let page handle it
        // This prevents redirect loops when role check is slow or fails
        const response = NextResponse.next()
        response.headers.set('x-user-role', 'none')
        response.headers.set('x-auth-checked', 'true')
        response.headers.set('x-role-check-failed', 'true')
        return response
      }
      
      // User has a role, but it's not merchant
      logSecurityEvent('Non-merchant accessing merchant route', {
        userId,
        pathname,
        role,
      })
      
      return NextResponse.redirect(new URL('/merchant/apply', req.url))
      
    } catch (error) {
      logSecurityEvent('Merchant route check error', {
        userId,
        pathname,
        error: (error as Error).message,
      })
      
      // On error, allow through and let the page handle authentication
      // This prevents redirect loops when there are temporary API issues
      const response = NextResponse.next()
      response.headers.set('x-role-check-failed', 'true')
      return response
    }
  }
  
  // Default: allow authenticated users through
  const response = NextResponse.next()
  response.headers.set('x-auth-checked', 'true')
  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths. Exclusions are handled in the middleware function above.
     * This ensures the root route '/' is always processed.
     */
    '/(.*)',
  ],
}