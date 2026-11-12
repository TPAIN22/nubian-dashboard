import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression for better performance
  compress: true,
  
  /**
   * There is deliberately no `webpack` option here.
   *
   * This project carried one:
   *
   *     webpack: (config, { isServer }) => {
   *       if (!isServer) config.resolve.fallback = { ...config.resolve.fallback, fs: false }
   *       config.resolve.modules = ['node_modules', ...(config.resolve.modules || [])]
   *       return config
   *     }
   *
   * With it present, every route rendered through middleware — which, given
   * the matcher in `src/middleware.ts`, is every route except the statically
   * prerendered ones — requested two client chunks that 404ed. The browser
   * refused them and **React never mounted**: `/shop`, `/shop/[productId]`
   * and `/sign-in` served correct HTML and then sat there inert, with no
   * drawer, no account button and no client-side navigation.
   *
   * Measured in a browser, clean room on both sides (one build, one server,
   * nothing rebuilt underneath it):
   *
   *   with the webpack fn     /shop reactMounted=false  blockedScripts=2
   *   without it              /shop reactMounted=true   blockedScripts=0
   *
   * Two things make this bug good at hiding, and both cost time here:
   *   - `curl` cannot see it. The failing <script> tags are injected by the
   *     client runtime, not present in the server-rendered HTML, so grepping
   *     the response body reports zero problems on a thoroughly broken page.
   *   - The unhashed `"static/chunks/main-app.js"` entry in
   *     `build-manifest.json` is *normal* and resolved at serve time. It
   *     looks like the smoking gun and is not.
   * Only "does React mount in a real browser" was a trustworthy signal.
   *
   * Neither line it contained was load-bearing: 'node_modules' is already
   * first in Next's default `resolve.modules`, and the build succeeds without
   * the `fs: false` fallback, so nothing in the client graph reaches for it.
   * Removing only `resolve.modules` is not enough — keeping `fs: false` alone
   * still reproduced the failure, so it is the presence of a custom webpack
   * function that matters, not its contents.
   *
   * If a dependency ever does pull `fs` into the client bundle, reach for
   * `serverExternalPackages` rather than reinstating this.
   */

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
    ],
    // WebP only: AVIF encoding in sharp is several times the memory and CPU
    // of WebP, and it runs inside this server process on a cold cache.
    formats: ['image/webp'],
    domains: [], // Add your image domains if needed
    // No source in public/ is wider than 2400px; 2048/3840 only re-encoded
    // full-size originals.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for SEO and security
  async headers() {
    // Build CSP based on environment
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Clerk domains - comprehensive list for custom domain support
    const clerkDomains = [
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      'https://*.clerk.dev',
      'https://clerk.com',
      'https://*.clerkstage.dev',
      'https://clerk.nubian-sd.com',
      'https://*.nubian-sd.com'
    ];
    const clerkDomainsString = clerkDomains.join(' ');
    const clerkWSSDomains = [
      'wss://*.clerk.accounts.dev',
      'wss://*.clerk.com',
      'wss://clerk.nubian-sd.com',
      'wss://*.nubian-sd.com'
    ].join(' ');
    
    const cspDirectives = [
      // Default source - allow self and Clerk domains for fallback
      // Also allow Googlebot and search engine resources
      `default-src 'self' ${clerkDomainsString} https://www.google.com https://www.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com`,
      // Clerk script sources - allow all Clerk domains, CDNs, and custom domains
      // script-src-elem is more specific and takes precedence for <script> elements
      // Allow Googlebot resources for proper page rendering during crawl
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${clerkDomainsString} blob: https://www.google.com https://www.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com`,
      `script-src-elem 'self' 'unsafe-inline' ${clerkDomainsString} blob: https://www.google.com https://www.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com`,
      `worker-src 'self' blob: ${clerkDomainsString}`,
      `style-src 'self' 'unsafe-inline' ${clerkDomainsString} https://fonts.googleapis.com`,
      "img-src 'self' data: https: blob:",
      `font-src 'self' data: ${clerkDomainsString} https://fonts.gstatic.com`,
      // Clerk API connections - allow all Clerk API endpoints and custom domains
      // Include both with and without wildcard to ensure coverage
      // Also allow Render.com API endpoints for backend connections
      // Allow Google Analytics and Tag Manager connections
      `connect-src 'self' http://localhost:* http://127.0.0.1:* ${clerkDomainsString} https://*.imagekit.io https://*.onrender.com https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com ${clerkWSSDomains}`,
      `frame-src 'self' ${clerkDomainsString} https://www.google.com https://www.google-analytics.com`,
      "object-src 'none'",
      "base-uri 'self'",
      `form-action 'self' ${clerkDomainsString}`,
      "frame-ancestors 'self'",
      // Additional directives for Clerk
      "manifest-src 'self'",
      "media-src 'self'",
    ];
    
    // Only add upgrade-insecure-requests in production (allows HTTP localhost in dev)
    if (!isDevelopment) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    return [
      // Exclude robots.txt and sitemap.xml from CSP to ensure search engines can access them
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; ')
          },
        ],
      },
    ];
  },

  // Enable React strict mode
  reactStrictMode: true,

  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
