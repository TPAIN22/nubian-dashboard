import { axiosInstance } from '@/lib/axiosInstance';
import { ProductsTable } from './productsTable';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { Suspense } from 'react';

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

async function getProducts() {
  try {
    const response = await axiosInstance.get("/products");
    
    
    // Backend returns: { success: true, data: [...], meta: {...} }
    // Handle different response structures
    let products = [];
    
    if (response.data?.success && Array.isArray(response.data?.data)) {
      // Standard backend response structure: { success: true, data: [...], meta: {...} }
      products = response.data.data;
    } else if (Array.isArray(response.data?.products)) {
      // Alternative structure with products key
      products = response.data.products;
    } else if (Array.isArray(response.data)) {
      // Direct array response
      products = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      // Nested data structure
      products = response.data.data;
    }
    
    
    return Array.isArray(products) ? products : [];
  } catch (error: any) {
    return [];
  }
}

function ProductsLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-muted-foreground">جاري التحميل...</div>
    </div>
  );
}

export default async function Page() {
  const products = await getProducts();
  
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
      <Suspense fallback={<ProductsLoading />}>
        <ProductsTable productsData={products as Product[]} />
      </Suspense>
    </div>
  )
}