import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, PackagePlus, Store as StoreIcon } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'

import { axiosInstance } from '@/lib/axiosInstance'
import { formatCurrency } from '@/lib/currency'
import { Alert, Page, PageBody, PageHeader, Stack } from '@/components/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StoreFormDialog } from '../StoreFormDialog'
import type { Store } from '../StoresTable'

export const dynamic = 'force-dynamic'

/**
 * Everything an admin needs about one store, including its full catalogue.
 *
 * Products are read from the admin endpoint (`/products/admin/all?merchant=`),
 * not the public listing, so inactive products show up here too — a store whose
 * items are all deactivated should look different from an empty one.
 */

type AdminProduct = {
  _id: string
  name: string
  images?: string[]
  category?: { name?: string } | null
  finalPrice?: number
  stock?: number
  isActive?: boolean
  variants?: { sku: string; stock?: number; isActive?: boolean }[]
}

// The admin list caps at 100 per page. A single store having more than that is
// unlikely today; when it happens the banner below says so rather than silently
// showing a truncated catalogue.
const PAGE_LIMIT = 100

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { getToken } = await auth()
  const token = await getToken()
  const headers = { Authorization: `Bearer ${token}` }

  const store: Store | null = await axiosInstance
    .get(`/merchants/${id}`, { headers })
    .then((res) => res.data?.data || res.data || null)
    .catch(() => null)

  if (!store) notFound()

  const productsResponse = await axiosInstance
    .get(`/products/admin/all`, {
      headers,
      params: { merchant: id, limit: PAGE_LIMIT, sortBy: 'createdAt', sortOrder: 'desc' },
    })
    .then((res) => res.data)
    .catch(() => null)

  const products: AdminProduct[] = productsResponse?.data ?? []
  const total: number = productsResponse?.meta?.pagination?.total ?? products.length
  const truncated = total > products.length

  const activeCount = products.filter((p) => p.isActive !== false).length

  return (
    <Page>
      <PageHeader
        title={store.storeName}
        description={[store.city, store.email].filter(Boolean).join(' · ')}
        actions={
          <div className="flex items-center gap-2">
            <StoreFormDialog store={store} />
            <Button asChild variant="secondary">
              <Link href={`/admin/products-advanced/new?merchant=${store._id}`}>
                <PackagePlus className="h-4 w-4 ms-1" />
                إضافة منتج
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/stores">
                <ArrowRight className="h-4 w-4 ms-1" />
                كل المتاجر
              </Link>
            </Button>
          </div>
        }
      />

      <PageBody>
        <Stack gap="md">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-md border object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground"
              >
                <StoreIcon className="h-6 w-6" />
              </span>
            )}
            <div className="min-w-0">
              <p className="font-medium">{store.ownerName}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {store.email}
                {store.phone ? ` · ${store.phone}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 ms-auto">
              {store.claimStatus === 'claimed' ? (
                <Badge variant="outline">مرتبط بحساب</Badge>
              ) : (
                <Badge variant="secondary">غير مرتبط</Badge>
              )}
              <Badge variant="outline">
                {total} منتج · {activeCount} مفعّل
              </Badge>
            </div>
          </div>

          {truncated && (
            <Alert tone="warning" title="القائمة مختصرة">
              يعرض هذا الجدول أول {products.length} منتج من أصل {total}. استخدم صفحة المنتجات
              للاطلاع على البقية.
            </Alert>
          )}

          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed py-16 text-center">
              <p className="text-sm text-muted-foreground">
                لا توجد منتجات لهذا المتجر بعد. أضف أول منتج نيابة عن التاجر.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">المنتج</TableHead>
                    <TableHead className="text-start">التصنيف</TableHead>
                    <TableHead className="text-start">السعر</TableHead>
                    <TableHead className="text-start">المخزون</TableHead>
                    <TableHead className="text-start">المتغيرات</TableHead>
                    <TableHead className="text-start">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-md border object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden
                              className="h-8 w-8 shrink-0 rounded-md border border-dashed"
                            />
                          )}
                          {product.name}
                        </span>
                      </TableCell>
                      <TableCell>{product.category?.name || '—'}</TableCell>
                      <TableCell>{formatCurrency(product.finalPrice)}</TableCell>
                      <TableCell>{product.stock ?? 0}</TableCell>
                      <TableCell>{product.variants?.length ?? 0}</TableCell>
                      <TableCell>
                        {product.isActive === false ? (
                          <Badge variant="secondary">معطّل</Badge>
                        ) : (
                          <Badge variant="outline">مفعّل</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Stack>
      </PageBody>
    </Page>
  )
}
