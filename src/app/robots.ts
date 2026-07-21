import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration for SEO
 * Consolidated for Admin & Merchant Dashboard platform
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://nubian-sd.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/contact',
          '/privacy-policy',
          '/exchange-policy',
          '/terms-conditions',
        ],
        disallow: [
          '/api/',
          '/business/',
          '/merchant/',
          '/affiliate',
          '/sign-in',
          '/sign-up',
          '/debug-role',
          '/_next/',
          '/admin/',
          '/shop/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/about',
          '/contact',
          '/privacy-policy',
          '/exchange-policy',
          '/terms-conditions',
        ],
        disallow: [
          '/api/',
          '/business/',
          '/merchant/apply',
          '/affiliate',
          '/sign-in',
          '/sign-up',
          '/debug-role',
          '/_next/',
          '/admin/',
          '/shop/',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/'],
        disallow: ['/api/', '/business/', '/merchant/', '/shop/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
