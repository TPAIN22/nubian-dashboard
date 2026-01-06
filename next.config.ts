import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression for better performance
  compress: true,
  
  // Webpack configuration for better chunk handling
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [], // Add your image domains if needed
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for SEO and security
  async headers() {
    // Build CSP based on environment
    const isDevelopment = process.env.NODE_ENV === 'development';
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com blob:",
      "worker-src 'self' blob: https://*.clerk.accounts.dev https://*.clerk.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.clerk.accounts.dev https://*.clerk.com https://*.imagekit.io",
      "frame-src 'self' https://*.clerk.accounts.dev",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ];
    
    // Only add upgrade-insecure-requests in production (allows HTTP localhost in dev)
    if (!isDevelopment) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    return [
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

  // Rewrite /business routes to /business (to match actual folder structure)
  async rewrites() {
    return [
      {
        source: '/business/:path*',
        destination: '/business/:path*',
      },
    ];
  },

  // Generate sitemap and robots.txt
  generateBuildId: async () => {
    // Generate a unique build ID
    return 'nubian-' + Date.now().toString();
  },
};

export default nextConfig;
