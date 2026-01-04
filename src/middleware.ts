import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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
  
  // Protect all other routes
  await auth.protect()
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
