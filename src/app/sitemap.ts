import { MetadataRoute } from 'next';

const baseUrl = "https://nubian-sd.store";

/**
 * Dynamic sitemap generator
 * Consolidated for Admin & Merchant Dashboard platform
 * Uses ISR with 1-hour revalidation
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages - always included
  const staticPages: MetadataRoute.Sitemap = [
    { 
      url: baseUrl, 
      lastModified: now, 
      changeFrequency: "daily", 
      priority: 1.0 
    },
    { 
      url: `${baseUrl}/about`, 
      lastModified: now, 
      changeFrequency: "monthly", 
      priority: 0.7 
    },
    { 
      url: `${baseUrl}/contact`, 
      lastModified: now, 
      changeFrequency: "monthly", 
      priority: 0.7 
    },
    { 
      url: `${baseUrl}/privacy-policy`, 
      lastModified: now, 
      changeFrequency: "yearly", 
      priority: 0.3 
    },
    { 
      url: `${baseUrl}/exchange-policy`, 
      lastModified: now, 
      changeFrequency: "yearly", 
      priority: 0.3 
    },
    { 
      url: `${baseUrl}/terms-conditions`, 
      lastModified: now, 
      changeFrequency: "yearly", 
      priority: 0.3 
    },
  ];

  console.log(`[Sitemap] Generated: ${staticPages.length} static pages`);

  return staticPages;
}
