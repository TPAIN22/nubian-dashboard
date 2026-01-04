import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// 👇 حدد الصفحات العامة التي يمكن للجميع دخولها
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
  const pathname = req.nextUrl.pathname;
  const url = req.nextUrl.clone();
  
  // Skip middleware entirely for static files and Next.js internal paths
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|otf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // For public routes, allow access without any Clerk processing
  // Explicitly return NextResponse to prevent any redirects
  if (isPublicRoute(req)) {
    const response = NextResponse.next();
    // Ensure no redirect headers are set
    response.headers.delete('Location');
    return response;
  }

  // Only protect non-public routes
  await auth.protect();
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/* (all Next.js internal paths including static, image, data for ISR)
     * - favicon.ico (favicon file)
     * - sitemap.xml (sitemap)
     * - robots.txt (robots file)
     * - Static files (images, fonts, etc.)
     * 
     * NOTE: API routes ARE included so middleware can protect them.
     * Public API routes like /api/ping are handled by isPublicRoute check.
     * 
     * _next/data paths are excluded to prevent authentication issues with ISR
     * and client-side navigation.
     */
    '/((?!_next/|favicon\\.ico$|sitemap\\.xml$|robots\\.txt$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|otf)$).*)',
  ],
}
