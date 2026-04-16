import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Type definitions for Clerk session claims
type UserRole = "admin" | "merchant" | undefined;

interface ClerkPublicMetadata {
  role?: "admin" | "merchant" | "support";
  merchantStatus?: "pending" | "approved" | "rejected" | "needs_revision";
}

interface ClerkSessionClaims {
  publicMetadata?: ClerkPublicMetadata;
}

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

  // API routes: Let them through, but clerkMiddleware() has already run
  // Individual API routes handle their own authentication using auth()
  if (url.pathname.startsWith("/api/")) {
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

  // 1. Redirect legacy /business routes to new /admin routes
  if (url.pathname.startsWith("/business")) {
    const newPath = url.pathname.replace("/business", "/admin");
    // Handle specific dashboard mapping
    if (newPath === "/admin/dashboard") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL(newPath, req.url));
  }

  // Define protected business/admin routes
  const isBusinessRoute =
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/management") ||
    url.pathname.startsWith("/merchant");

  // If not a protected route, allow through
  if (!isBusinessRoute) {
    return NextResponse.next();
  }

  // ❌ Not logged in - redirect immediately to /sign-in
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Authenticated section
  const claims = sessionClaims as ClerkSessionClaims | undefined;
  let role = claims?.publicMetadata?.role?.toLowerCase();
  let merchantStatus = claims?.publicMetadata?.merchantStatus;

  // 1. Robust role detection: If role is missing from session claims, fetch directly from Clerk
  // This handles cases where publicMetadata hasn't been added to the session token yet
  if (!role && userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = (user.publicMetadata?.role as string | undefined)?.toLowerCase() as any;
      merchantStatus = user.publicMetadata?.merchantStatus as any;
    } catch (error) {
      console.error("Middleware fallback auth error:", error);
    }
  }

  // 2. Base Dashboard Redirection (/dashboard or /)
  if (url.pathname === "/dashboard" || url.pathname === "/") {
    // Only redirect from home page if they have a specialized role
    if (role === "admin" || role === "support") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (role === "merchant") {
      if (merchantStatus === "approved") {
        return NextResponse.redirect(new URL("/merchant/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/merchant/pending", req.url));
    }
    // Regular users stay on home page
    if (url.pathname === "/dashboard") {
       return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 3. Admin Routes Protection (/admin/**)
  if (url.pathname.startsWith("/admin")) {
    if (role !== "admin" && role !== "support") {
       return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 4. Merchant Business Tools Protection (/merchant/dashboard, etc.)
  const isBusinessTool = 
    url.pathname.startsWith("/merchant/") && 
    !["apply", "pending", "dashboard"].some(p => url.pathname.startsWith(`/merchant/${p}`));

  // Specific dashboard check to allow consistent routing
  if (url.pathname === "/merchant/dashboard") {
     if (role !== "merchant" || merchantStatus !== "approved") {
        return NextResponse.redirect(new URL("/merchant/apply", req.url));
     }
     return NextResponse.next();
  }

  if (isBusinessTool) {
    if (role !== "merchant" || merchantStatus !== "approved") {
      if (merchantStatus) return NextResponse.redirect(new URL("/merchant/pending", req.url));
      return NextResponse.redirect(new URL("/merchant/apply", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|css|js|woff|woff2|ttf|eot|otf|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
