import { MetadataRoute } from 'next';

import { getCategories, getHomeFeed, getProducts } from '@/lib/storefront/api';
import { routes } from '@/lib/storefront/routes';

const baseUrl = "https://nubian-sd.com";

/**
 * Sitemap.
 *
 * Static marketing pages plus the public catalogue. Before the storefront
 * existed there was nothing to enumerate beyond eight static URLs; now every
 * product, department, collection and merchant storefront is a real,
 * server-rendered page and belongs in here.
 *
 * Catalogue reads go through `lib/storefront/api`, which never throws — if
 * the backend is unreachable while the sitemap regenerates, the static half
 * still ships rather than the whole route failing.
 */
export const revalidate = 3600;

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
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${baseUrl}/dashboards`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
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

  // Catalogue. `limit` is the backend's per-request maximum; the catalogue is
  // well inside it today and the cap keeps this route bounded if it grows.
  const [categories, feed, catalogue] = await Promise.all([
    getCategories(),
    getHomeFeed(),
    getProducts({ limit: 100 }),
  ]);

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}${routes.category(category.id)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const collectionPages: MetadataRoute.Sitemap = feed.collections.map((collection) => ({
    url: `${baseUrl}${routes.collection(collection.slug)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const storePages: MetadataRoute.Sitemap = feed.stores.map((store) => ({
    url: `${baseUrl}${routes.store(store.id)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productPages: MetadataRoute.Sitemap = catalogue.products.map((product) => ({
    url: `${baseUrl}${routes.product(product.id)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const all = [
    ...staticPages,
    ...categoryPages,
    ...collectionPages,
    ...storePages,
    ...productPages,
  ];

  console.log(
    `[Sitemap] Generated: ${staticPages.length} static, ${categoryPages.length} categories, ` +
      `${collectionPages.length} collections, ${storePages.length} stores, ` +
      `${productPages.length} products`,
  );

  return all;
}
