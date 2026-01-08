'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { axiosInstance } from '@/lib/axiosInstance';
import { ProductsTable } from './productsTable';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { toast } from 'sonner'

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice: number;
  stock: number;
  isActive: boolean;
  description: string;
  images: string[];
  sizes: string[];
  createdAt: string;
  updatedAt: string;
}

export default function Page() {
  const { getToken } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    try {
      const token = await getToken()
      const response = await axiosInstance.get("/products", {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });
      
      // Backend returns: { success: true, data: [...], meta: {...} }
      // Handle different response structures
      let productsData = [];
      
      if (response.data?.success && Array.isArray(response.data?.data)) {
        productsData = response.data.data;
      } else if (Array.isArray(response.data?.products)) {
        productsData = response.data.products;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      }
      
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error: any) {
      toast.error('فشل تحميل المنتجات')
      setProducts([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - fetch only on mount

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">جاري التحميل...</div>
      </div>
    )
  }
  
  return (
    <div className='flex flex-col gap-4 h-full sm:mx-12 mx-2'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-center'>المنتجات</h1>
        <Link href="/business/products/new" >
          <Button className='w-30 py-2 cursor-pointer'>
            <IconPlus className="w-4 h-4 ml-2" />
            اضافة منتج
          </Button>
        </Link>
      </div>
      <ProductsTable 
        productsData={products} 
        getToken={getToken}
        onProductUpdate={fetchProducts}
      />
    </div>
  )
}