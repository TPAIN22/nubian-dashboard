import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const authResult = await auth();
  const { userId, sessionClaims } = authResult;
  const url = req.nextUrl;

  // Skip Next.js internal paths and static files
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/sitemap.xml" ||
    url.pathname === "/robots.txt" ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|otf)$/.test(url.pathname)
  ) {
    return NextResponse.next();
  }

  // Explicitly allow /sign-in routes (including catch-all sub-routes for Clerk)
  // Clerk's SignIn component needs access to all sub-routes under /sign-in
  if (url.pathname.startsWith("/sign-in")) {
    return NextResponse.next();
  }

  // Check if user needs to be authenticated for /merchant/apply
  const isMerchantApplyRoute = url.pathname.startsWith("/merchant/apply");
  
  // Require authentication for /merchant/apply
  if (isMerchantApplyRoute) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    // If authenticated, allow through (no role check needed)
    return NextResponse.next();
  }

  // Define protected business/admin routes
  const isBusinessRoute =
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/business") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/management");

  // If not a protected route, allow through
  if (!isBusinessRoute) {
    return NextResponse.next();
  }

  // ❌ Not logged in - redirect immediately to /sign-in
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Get role from Clerk session claims (publicMetadata or privateMetadata)
  const role =
    sessionClaims?.publicMetadata?.role ||
    sessionClaims?.privateMetadata?.role;

  // ❌ Logged in but NOT admin
  if (role !== "admin") {
    if (role === "merchant") {
      return NextResponse.redirect(new URL("/merchant/apply", req.url));
    }

    // Any other role (including undefined) → redirect to /sign-in
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // ✅ Admin - allow access
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/business/:path*",
    "/dashboard/:path*",
    "/management/:path*",
    "/merchant/apply/:path*",
  ],
};
