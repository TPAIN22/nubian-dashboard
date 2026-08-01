import Link from 'next/link'
import { Plus, Tags } from 'lucide-react'

import { axiosInstance } from '@/lib/axiosInstance'
import CategoryListClient from '@/components/categoreyClient'
import {
  Button,
  EmptyState,
  ErrorState,
  Page,
  PageBody,
  PageHeader,
  Stack,
  Stat,
  StatRow,
} from '@/components/admin'

/* ============================================================================
   Categories
   ----------------------------------------------------------------------------
   Data fetching is unchanged (server component, GET /categories, force-dynamic).

   Fixed along the way: the "add category" action only existed inside the empty
   state, so once you had one category there was no way to add a second from
   this page — and the link pointed at /business/categories/new, a path that
   only works because middleware rewrites it. Both corrected.
   ========================================================================== */

interface Category {
  _id: string
  name: string
  description?: string
  image?: string
  parent?: { _id: string; name: string } | null
  children?: Category[]
}

async function CategoriesPage() {
  let categories: Category[] = []
  let error: string | null = null

  try {
    const response = await axiosInstance.get('/categories')
    categories = response.data
    if (!Array.isArray(categories)) {
      throw new Error('تنسيق البيانات المُستلمة غير صحيح')
    }
  } catch (err) {
    error =
      err instanceof Error ? err.message : 'فشل في تحميل التصنيفات. يرجى المحاولة مرة أخرى.'
  }

  const roots = categories.filter((c) => !c.parent).length
  const children = categories.length - roots

  return (
    <Page>
      <PageHeader
        title="التصنيفات"
        description="شجرة تصنيفات المتجر — الرئيسية والفرعية."
        actions={
          <Button variant="primary" size="sm" asChild>
            <Link href="/admin/categories/new">
              <Plus />
              تصنيف جديد
            </Link>
          </Button>
        }
      />

      <PageBody>
        {error ? (
          <ErrorState size="page" description={error} />
        ) : (
          <Stack gap="lg">
            <StatRow columns={3}>
              <Stat label="إجمالي التصنيفات" value={categories.length} />
              <Stat label="التصنيفات الرئيسية" value={roots} />
              <Stat label="التصنيفات الفرعية" value={children} />
            </StatRow>

            {categories.length === 0 ? (
              <EmptyState
                size="page"
                icon={<Tags className="size-4" />}
                title="لا توجد تصنيفات بعد"
                description="التصنيفات هي ما ينظّم المنتجات في المتجر. ابدأ بإضافة التصنيف الأول."
                action={
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/admin/categories/new">
                      <Plus />
                      إضافة أول تصنيف
                    </Link>
                  </Button>
                }
              />
            ) : (
              <CategoryListClient categories={categories} />
            )}
          </Stack>
        )}
      </PageBody>
    </Page>
  )
}

export default CategoriesPage

// Caching / revalidation settings preserved from the original.
export const revalidate = 60
export const dynamic = 'force-dynamic'
