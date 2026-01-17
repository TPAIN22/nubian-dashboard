'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { axiosInstance } from '@/lib/axiosInstance';
import { ProductsTable } from './productsTable';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { toast } from 'sonner'
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const runtime = 'edge';


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
  category?: {
    _id: string;
    name: string;
  } | string;
  merchant?: {
    _id: string;
    businessName: string;
    businessEmail: string;
    status?: string;
  };
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Ranking fields (admin-controlled)
  priorityScore?: number;
  featured?: boolean;
}

export default function Page() {
  const { getToken } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    includeDeleted: false,
  })

  const fetchProducts = useCallback(async (params?: {
    category?: string;
    merchant?: string;
    isActive?: string;
    includeDeleted?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const token = await getToken()
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        setLoading(false)
        return
      }

      // Build query string for admin endpoint
      const queryParams = new URLSearchParams()
      if (params?.category) queryParams.append('category', params.category)
      if (params?.merchant) queryParams.append('merchant', params.merchant)
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive)
      if (params?.includeDeleted === 'true') queryParams.append('includeDeleted', 'true')
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())

      const queryString = queryParams.toString()
      const url = `/products/admin/all${queryString ? `?${queryString}` : ''}`

      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Admin endpoint returns: { success: true, data: [...], page, limit, total }
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
      console.error('Error fetching products:', error)
      toast.error(error.response?.data?.message || 'فشل تحميل المنتجات')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchProducts({
      search: filters.search || undefined,
      isActive: filters.isActive || undefined,
      includeDeleted: filters.includeDeleted ? 'true' : undefined,
    })
  }, [fetchProducts, filters])
  
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

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
      
      {/* Filters */}
      <div className='flex gap-4 flex-wrap items-end p-4 bg-muted/50 rounded-lg'>
        <div className='flex-1 min-w-[200px]'>
          <Label htmlFor='search'>بحث</Label>
          <Input
            id='search'
            placeholder='ابحث بالاسم أو الوصف...'
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className='mt-1'
          />
        </div>
        <div className='min-w-[150px]'>
          <Label htmlFor='isActive'>الحالة</Label>
          <Select
            value={filters.isActive || 'all'}
            onValueChange={(value) => handleFilterChange('isActive', value === 'all' ? '' : value)}
          >
            <SelectTrigger id='isActive' className='mt-1'>
              <SelectValue placeholder='الكل' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>الكل</SelectItem>
              <SelectItem value='true'>نشط</SelectItem>
              <SelectItem value='false'>غير نشط</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-2 min-w-[150px]'>
          <Switch
            id='includeDeleted'
            checked={filters.includeDeleted}
            className='cursor-pointer'
            onCheckedChange={(checked) => handleFilterChange('includeDeleted', checked)}
          />
          <Label htmlFor='includeDeleted' className='cursor-pointer'>
            إظهار المحذوفة
          </Label>
        </div>
      </div>
      
      <ProductsTable 
        productsData={products} 
        getToken={getToken}
        onProductUpdate={() => fetchProducts({
          search: filters.search || undefined,
          isActive: filters.isActive || undefined,
          includeDeleted: filters.includeDeleted ? 'true' : undefined,
        })}
      />
    </div>
  )
}