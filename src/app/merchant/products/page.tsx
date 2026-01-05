'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { axiosInstance } from '@/lib/axiosInstance'
import { Button } from '@/components/ui/button'
import { IconPlus } from '@tabler/icons-react'
import Link from 'next/link'
import { ProductsTable } from './productsTable'
import { toast } from 'sonner'
import logger from '@/lib/logger'

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
  const { getToken } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = await getToken()
        
        if (!token) {
          logger.error('Authentication token is null', {})
          toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
          setLoading(false)
          return
        }
        
        const response = await axiosInstance.get('/products/merchant/my-products', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        // Backend returns standardized response: { success, data: [...], meta: {...} }
        setProducts(response.data.data || [])
      } catch (error: any) {
        logger.error('Error fetching products', { error: error instanceof Error ? error.message : String(error) })
        toast.error('فشل تحميل المنتجات')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [getToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">منتجاتي</h1>
        <Link href="/merchant/products/new">
          <Button className="gap-2">
            <IconPlus className="h-4 w-4" />
            إضافة منتج
          </Button>
        </Link>
      </div>
      <ProductsTable 
        productsData={products} 
        getToken={getToken}
        onProductUpdate={async () => {
          // Refresh products after update
          try {
            const token = await getToken()
            if (!token) {
              logger.error('Authentication token is null during refresh', {})
              toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
              return
            }
            const res = await axiosInstance.get('/products/merchant/my-products', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            setProducts(res.data.data || [])
          } catch (err) {
            logger.error('Error refreshing products', { error: err instanceof Error ? err.message : String(err) })
            toast.error('فشل تحديث المنتجات')
          }
        }} 
      />
    </div>
  )
}

