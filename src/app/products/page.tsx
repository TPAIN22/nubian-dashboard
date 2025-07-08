// page.tsx

import Side from '@/components/ui/side-bar-provider'
import { axiosInstance } from '@/lib/axiosInstance';
import { Key } from 'lucide-react';
import React from 'react'
import { ProductsTable } from './productsTable'; // تأكد من استيراد Product
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

// تعريف الـ Interface للمنتج
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


async function page() {
  const { products, page, totalPages } = await axiosInstance.get("/products").then(res => res.data);
  (products);

  // نقوم بتمرير المنتجات إلى ProductsTable
  return (
    <div className='flex flex-col gap-4 h-full mx-15'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-center'>المنتجات</h1>
        <Link href="/products/new" >
          <Button className='w-30 py-2 cursor-pointer'><IconPlus/>
            اضافة منتج
          </Button>
        </Link>
      </div>
      <ProductsTable productsData={products as Product[]} />
    </div>
  )
}

export default page