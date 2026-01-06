import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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
  '/business(.*)', // Also check business route (actual folder name)
])

const isMerchantRoute = createRouteMatcher([
  '/merchant(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname
  
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
  
  // Get auth data - use the correct Clerk middleware API
  const { userId, sessionClaims } = await auth()
  
  // If user is authenticated and trying to access sign-in/sign-up, redirect them away
  if (userId && (pathname === '/sign-in' || pathname.startsWith('/sign-in') || pathname === '/sign-up' || pathname.startsWith('/sign-up'))) {
    // Get role to redirect to appropriate dashboard
    let role = (sessionClaims?.publicMetadata as any)?.role as string | undefined
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/business/dashboard', req.url))
    } else if (role === 'merchant') {
      return NextResponse.redirect(new URL('/merchant/dashboard', req.url))
    } else {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
  
  // Handle public routes (including root route) - no auth needed
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }
  
  if (!userId) {
    // Only redirect to sign-in if not already there to prevent loops
    if (pathname !== '/sign-in') {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    return NextResponse.next()
  }

  // Helper function to get user role (only called when needed)
  const getUserRole = async (): Promise<string | undefined> => {
    // Try sessionClaims first (faster, if available)
    let role = (sessionClaims?.publicMetadata as any)?.role as string | undefined
    
    // If role not in sessionClaims, fetch from Clerk API
    if (role === undefined) {
      try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        role = user.publicMetadata?.role as string | undefined
        // Role fetched successfully
      } catch (error: any) {
        // Error fetching user role - will be handled by redirect
        return undefined
      }
    }
    return role
  }

  // Check admin routes
  // Match backend logic exactly: src/middleware/auth.middleware.js
  // Backend uses: user.publicMetadata.role !== 'admin' (strict check)
  if (isAdminRoute(req)) {
    try {
      const role = await getUserRole()
      
      // Match backend check exactly: user.publicMetadata.role !== 'admin'
      // Backend uses strict !== (not case-insensitive)
      if (role !== 'admin') {
        // Redirect non-admins away from admin routes
        const response = NextResponse.redirect(new URL('/', req.url))
        response.headers.set('x-redirect-reason', 'not-admin')
        return response
      }
      
      // Admin access granted
    } catch (error: any) {
      // Error checking admin role - if user is authenticated, redirect to home
      // If not authenticated, redirect to sign-in
      if (userId) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  // Check merchant routes
  if (isMerchantRoute(req)) {
    // Allow /merchant/apply and /merchant/pending for all authenticated users
    // These pages will handle their own logic
    if (pathname === '/merchant/apply' || pathname === '/merchant/pending') {
      return NextResponse.next()
    }
    
    try {
      const role = await getUserRole()
      
      // Only redirect if we're CERTAIN the user is not a merchant
      // If role is undefined (couldn't determine), let the page handle it
      // This prevents redirects when role check is slow or fails
      if (role !== undefined && role !== 'merchant') {
        // User is definitely not a merchant, redirect to apply
        return NextResponse.redirect(new URL('/merchant/apply', req.url))
      }
      
      // If role is 'merchant' or undefined, let the request through
      // The dashboard page will check merchant status and handle redirects appropriately
      // This prevents premature redirects when role check is in progress
      return NextResponse.next()
    } catch (error) {
      // Error checking merchant role - don't redirect, let the page handle it
      // This prevents redirect loops when there are temporary API issues
      // If there's an error, allow the request through and let the page handle authentication
      return NextResponse.next()
    }
  }
  
  return NextResponse.next()
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
