/**
 * Server-safe API for fetching public data
 * This module uses native fetch() without browser/Clerk dependencies
 * For use in Server Components and generateMetadata functions
 */

// Normalize API URL
function getApiUrl(): string {
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  // Remove trailing slash
  apiUrl = apiUrl.replace(/\/$/, '');
  // Add /api if not present
  if (!apiUrl.endsWith('/api')) {
    apiUrl = `${apiUrl}/api`;
  }
  return apiUrl;
}

const API_URL = getApiUrl();

/**
 * Fetch a single product by ID (public, no auth required)
 */
export async function getProductServer(id: string) {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      next: { revalidate: 60 }, // 1 minute cache
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('[serverApi] Failed to fetch product:', id, error);
    return null;
  }
}

/**
 * Fetch all products (public, for sitemap)
 */
export async function getProductsServer(params?: { limit?: number; isActive?: boolean }) {
  try {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    
    const url = `${API_URL}/products${searchParams.toString() ? `?${searchParams}` : ''}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // 1 hour cache
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('[serverApi] Failed to fetch products:', error);
    return [];
  }
}

/**
 * Fetch a single category by ID (public)
 */
export async function getCategoryServer(id: string) {
  try {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      next: { revalidate: 300 }, // 5 minute cache
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('[serverApi] Failed to fetch category:', id, error);
    return null;
  }
}

/**
 * Fetch all categories (public, for sitemap)
 */
export async function getCategoriesServer() {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 3600 }, // 1 hour cache
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('[serverApi] Failed to fetch categories:', error);
    return [];
  }
}

/**
 * Fetch a single store by ID (public)
 */
export async function getStoreServer(id: string) {
  try {
    const res = await fetch(`${API_URL}/merchants/store/${id}`, {
      next: { revalidate: 300 }, // 5 minute cache
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('[serverApi] Failed to fetch store:', id, error);
    return null;
  }
}

/**
 * Fetch all stores (public, for sitemap)
 */
export async function getStoresServer(params?: { limit?: number }) {
  try {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    
    const url = `${API_URL}/merchants/list${searchParams.toString() ? `?${searchParams}` : ''}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // 1 hour cache
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('[serverApi] Failed to fetch stores:', error);
    return [];
  }
}
