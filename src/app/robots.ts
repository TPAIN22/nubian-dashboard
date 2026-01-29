import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration for SEO
 * Explicitly allows shop pages for crawling
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://nubian-sd.store';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shop',
          '/shop/*',
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
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/shop',
          '/shop/*',
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
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/', '/shop', '/shop/*'],
        disallow: ['/api/', '/business/', '/merchant/'],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/shop',
          '/shop/*',
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
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
