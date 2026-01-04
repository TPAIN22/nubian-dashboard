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
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }
  
  await auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next/|favicon\\.ico$|sitemap\\.xml$|robots\\.txt$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|otf)$).*)',
  ],
}
