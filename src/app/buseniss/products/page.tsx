import { axiosInstance } from '@/lib/axiosInstance';
import { ProductsTable } from './productsTable';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

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

export default async function Page() {
  const { products } = await axiosInstance.get("/products").then(res => res.data);

  return (
    <div className='flex flex-col gap-4 h-full sm:mx-12 mx-2'>
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