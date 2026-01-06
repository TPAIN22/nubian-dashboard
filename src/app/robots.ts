import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://nubian-sd.store';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/business/', '/sign-in', '/sign-up'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/business/', '/sign-in', '/sign-up'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/business/', '/sign-in', '/sign-up'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

