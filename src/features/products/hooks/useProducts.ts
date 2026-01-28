import { useSuspenseQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { productApi } from '../api/productApi';
import type { ProductFilters } from '../types/product';

export const useProducts = (filters: ProductFilters) => {
  const { getToken } = useAuth();

  return useSuspenseQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      // Prevent SSR execution where useAuth/axios might fail
      if (typeof window === 'undefined' || typeof getToken !== 'function') {
        return [];
      }
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return productApi.getProducts(filters, token);
    },
  });
};
