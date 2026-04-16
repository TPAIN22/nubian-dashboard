import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration for SEO
 * Consolidated for Admin & Merchant Dashboard platform
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://nubian-sd.store';

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
