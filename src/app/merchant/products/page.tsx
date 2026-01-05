'use client'

import { useEffect, useState } from 'react'
import { axiosInstance } from '@/lib/axiosInstance'
import { Button } from '@/components/ui/button'
import { IconPlus } from '@tabler/icons-react'
import Link from 'next/link'
import { ProductsTable } from './productsTable'
import { toast } from 'sonner'

interface Product {
  _id: string
  name: string
  price: number
  discountPrice: number
  stock: number
  isActive: boolean
  description: string
  images: string[]
  sizes: string[]
  category: any
  createdAt: string
  updatedAt: string
}

export default function MerchantProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get('/products/merchant/my-products')
        setProducts(response.data.products || [])
      } catch (error: any) {
        console.error('Error fetching products:', error)
        toast.error('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link href="/merchant/products/new">
          <Button className="w-30 py-2 cursor-pointer">
            <IconPlus />
            Add Product
          </Button>
        </Link>
      </div>
      <ProductsTable productsData={products} onProductUpdate={() => {
        // Refresh products after update
        axiosInstance.get('/products/merchant/my-products')
          .then(res => setProducts(res.data.products || []))
          .catch(err => console.error('Error refreshing products:', err))
      }} />
    </div>
  )
}

