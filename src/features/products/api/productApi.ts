import { axiosInstance } from '@/lib/axiosInstance';
import type { Product, ProductFilters } from '../types/product';

export const productApi = {
  getProducts: async (filters: ProductFilters, token: string | null): Promise<Product[]> => {
    if (!token) throw new Error('Authentication required');

    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.merchant) queryParams.append('merchant', filters.merchant);
    if (filters.isActive === 'true' || filters.isActive === 'false') {
      queryParams.append('isActive', filters.isActive);
    }
    if (filters.includeDeleted) queryParams.append('includeDeleted', filters.includeDeleted);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const queryString = queryParams.toString();
    const url = `/products/admin/all${queryString ? `?${queryString}` : ''}`;

    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('[ProductAPI] Raw Response:', response);
    console.log('[ProductAPI] Response Data:', response.data);

    // Normalized response handling based on legacy observation
    let productsData: Product[] = [];
    const data = response.data;

    if (data?.success && Array.isArray(data?.data)) {
      productsData = data.data;
    } else if (Array.isArray(data?.products)) {
      productsData = data.products;
    } else if (Array.isArray(data)) {
      productsData = data;
    } else if (data?.data && Array.isArray(data.data)) {
      productsData = data.data;
    }

    console.log('[ProductAPI] Parsed productsData:', productsData);
    return productsData;
  }
};
