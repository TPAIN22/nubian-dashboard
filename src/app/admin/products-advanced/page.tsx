'use client'

import { Suspense, useCallback, useState } from 'react'
import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'

import { ProductsContent } from '@/features/products/components/ProductsContent'
import { Button, ListSkeleton, Page, PageBody, PageHeader } from '@/components/admin'

export default function Page_() {
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    includeDeleted: false,
  })

  const handleFilterChange = (key: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleRefresh = useCallback(() => {
    // ProductsContent owns its own query; nothing to do here.
  }, [])

  return (
    <Page>
      <PageHeader
        title="المنتجات"
        description="إدارة كتالوج المنتجات والمخزون عبر كل المتاجر."
        actions={
          <>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/admin/products-advanced/import">
                <Upload />
                استيراد
              </Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/admin/products-advanced/new">
                <Plus />
                منتج جديد
              </Link>
            </Button>
          </>
        }
      />

      <PageBody>
        <Suspense fallback={<ListSkeleton rows={8} />}>
          <ProductsContent
            filters={{
              ...filters,
              includeDeleted: filters.includeDeleted ? 'true' : undefined,
            }}
            onFilterChange={handleFilterChange}
            onRefresh={handleRefresh}
          />
        </Suspense>
      </PageBody>
    </Page>
  )
}
