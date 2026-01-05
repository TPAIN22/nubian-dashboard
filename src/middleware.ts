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
  '/buseniss(.*)',
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
  
  // Handle public routes (including root route) - no auth needed
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }
  
  // Get auth data - use the correct Clerk middleware API
  const { userId, sessionClaims } = await auth()
  
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
      // Error checking admin role - redirect to sign in
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  // Check merchant routes
  if (isMerchantRoute(req)) {
    // Allow /merchant/apply for all authenticated users
    if (pathname === '/merchant/apply') {
      return NextResponse.next()
    }
    
    try {
      const role = await getUserRole()
      
      // Match backend logic: user.publicMetadata?.role !== 'merchant'
      if (role !== 'merchant') {
        // Redirect non-merchants away from merchant routes (except apply)
        return NextResponse.redirect(new URL('/merchant/apply', req.url))
      }
      
      // For merchant routes, also check if they're trying to access pending page
      // If they're approved, redirect from /merchant/pending to /merchant/dashboard
      if (pathname === '/merchant/pending') {
        // Allow access to pending page - the page itself will check status
        return NextResponse.next()
      }
    } catch (error) {
      // Error checking merchant role - redirect to sign in
      return NextResponse.redirect(new URL('/sign-in', req.url))
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
