import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // شغّل middleware على كل الصفحات
    // ما عدا:
    // - ملفات Next
    // - الملفات الثابتة
    // - sitemap.xml
    // - robots.txt
    '/((?!_next|sitemap.xml|robots.txt|favicon.ico|.*\\..*).*)',
  ],
}
