import { MetadataRoute } from 'next';

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
        allow: ['/'],
        disallow: ['/api/', '/business/', '/merchant/'],
      },
      {
        userAgent: 'Bingbot',
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
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

