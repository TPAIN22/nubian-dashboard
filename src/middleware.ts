import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/about',
  '/contact',
  '/privacy-policy',
  '/exchange-policy',
  '/api/ping',
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
  
  // Handle public routes (including root route)
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }
  
  // Protect all other routes - require authentication
  const { userId } = await auth.protect()
  
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Check admin routes
  if (isAdminRoute(req)) {
    try {
      const user = await clerkClient.users.getUser(userId)
      const role = user.publicMetadata?.role as string | undefined
      
      if (role !== 'admin') {
        // Redirect non-admins away from admin routes
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch (error) {
      console.error('Error checking admin role:', error)
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
      const user = await clerkClient.users.getUser(userId)
      const role = user.publicMetadata?.role as string | undefined
      
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
      console.error('Error checking merchant role:', error)
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
