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
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
