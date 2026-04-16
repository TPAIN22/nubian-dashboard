'use client'

import { Suspense, useState, useCallback } from 'react'
import { ProductsContent } from '@/features/products/components/ProductsContent'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { IconPlus } from '@tabler/icons-react'
import { PageHeader } from "@/components/dashboard/PageHeader"

export default function Page() {
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    includeDeleted: false,
  })
  
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleRefresh = useCallback(() => {
    // Refresh logic if needed
  }, [])

  return (
    <div className="container max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="المنتجات" 
        description="إدارة مخزون المنتجات وتعديل التفاصيل."
      >
        <Link href="/business/products/new">
          <Button className="rounded-full shadow-sm">
            <IconPlus className="w-5 h-5 ml-2" />
            اضافة منتج
          </Button>
        </Link>
      </PageHeader>
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-64 border rounded-xl bg-card/50">
          <div className="text-sm text-muted-foreground animate-pulse">جاري التحميل...</div>
        </div>
      }>
        <ProductsContent 
          filters={{
            ...filters,
            includeDeleted: filters.includeDeleted ? 'true' : undefined
          }} 
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
        />
      </Suspense>
    </div>
  )
}
