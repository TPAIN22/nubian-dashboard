'use client';

import React, { useCallback, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductsTable } from './ProductsTable';
import type { ProductFilters } from '../types/product';
import { useAuth } from '@clerk/nextjs';

interface ProductsContentProps {
  filters: ProductFilters;
  onFilterChange: (key: keyof ProductFilters, value: any) => void;
  onRefresh: () => void;
}

export const ProductsContent = ({ filters, onFilterChange, onRefresh }: ProductsContentProps) => {
  const { data: products, refetch } = useProducts(filters);
  const { getToken } = useAuth();
  
  const handleProductUpdate = useCallback(async () => {
    await refetch();
    onRefresh();
  }, [refetch, onRefresh]);

  return (
    <>
      <ProductsTable 
        productsData={products} 
        getToken={getToken}
        onProductUpdate={handleProductUpdate}
        currentFilters={filters}
        onFilterChange={onFilterChange}
      />
    </>
  );
};
