import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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
  // Only protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
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
