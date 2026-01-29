import { MetadataRoute } from 'next';
import { getProductsServer, getCategoriesServer, getStoresServer } from '@/lib/serverApi';

const baseUrl = "https://nubian-sd.store";

/**
 * Dynamic sitemap generator
 * Fetches products, categories, and stores from API for SEO
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
      url: `${baseUrl}/shop`, 
      lastModified: now, 
      changeFrequency: "daily", 
      priority: 0.95 
    },
    { 
      url: `${baseUrl}/shop/categories`, 
      lastModified: now, 
      changeFrequency: "weekly", 
      priority: 0.9 
    },
    { 
      url: `${baseUrl}/shop/stores`, 
      lastModified: now, 
      changeFrequency: "weekly", 
      priority: 0.9 
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

  // Fetch dynamic content in parallel
  const [products, categories, stores] = await Promise.all([
    getProductsServer({ limit: 1000, isActive: true }),
    getCategoriesServer(),
    getStoresServer({ limit: 100 }),
  ]);

  // Product pages - high priority for e-commerce SEO
  const productPages: MetadataRoute.Sitemap = products.map((product: { _id: string; updatedAt?: string }) => ({
    url: `${baseUrl}/shop/product/${product._id}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category: { _id: string }) => ({
    url: `${baseUrl}/shop/category/${category._id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Store pages
  const storePages: MetadataRoute.Sitemap = stores.map((store: { _id: string }) => ({
    url: `${baseUrl}/shop/store/${store._id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Log sitemap stats for debugging
  console.log(`[Sitemap] Generated: ${staticPages.length} static, ${productPages.length} products, ${categoryPages.length} categories, ${storePages.length} stores`);

  return [...staticPages, ...productPages, ...categoryPages, ...storePages];
}
