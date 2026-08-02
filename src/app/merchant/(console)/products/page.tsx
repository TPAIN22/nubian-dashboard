'use client'

import * as React from 'react'
import Link from 'next/link'
import { Download, Package, Plus, RefreshCw } from 'lucide-react'

import {
  Button,
  ClearFilters,
  EmptyState,
  ErrorState,
  Filter,
  Page,
  PageBody,
  PageHeader,
  Pagination,
  SearchInput,
  Section,
  SegmentedControl,
  Toolbar,
  ToolbarDivider,
  ToolbarSpacer,
  useColumnVisibility,
} from '@/components/admin'
import { useMerchantProducts, type MerchantProduct } from '@/features/merchant/api'
import {
  ProductsTable,
  categoryName,
  sellingPrice,
  useProductActions,
  useProductColumns,
} from './productsTable'

/* ============================================================================
   Products
   ----------------------------------------------------------------------------
   Owns search, filtering, sorting and paging; the table owns rows and row
   actions. Splitting it this way is what lets the controls live on one 40px
   toolbar instead of the 120px stack of full-height buttons this page used to
   open with.
   ========================================================================== */

type StockFilter = 'all' | 'in_stock' | 'low' | 'out'
type StatusFilter = 'all' | 'active' | 'inactive'
type SortState = { id: string; dir: 'asc' | 'desc' } | null

const PAGE_SIZES = [25, 50, 100]

export default function MerchantProductsPage() {
  const products = useMerchantProducts()
  const actions = useProductActions()

  const [query, setQuery] = React.useState('')
  const [stock, setStock] = React.useState<StockFilter>('all')
  const [status, setStatus] = React.useState<StatusFilter>('all')
  const [sort, setSort] = React.useState<SortState>({ id: 'updatedAt', dir: 'desc' })
  const [selected, setSelected] = React.useState<string[]>([])
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [density, setDensity] = React.useState<'compact' | 'comfortable'>('compact')

  const all = React.useMemo(() => products.data ?? [], [products.data])

  /* ---- counts drive the filter chips, so the numbers are never a guess ---- */
  const counts = React.useMemo(
    () => ({
      all: all.length,
      inStock: all.filter((p) => (p.stock ?? 0) >= 10).length,
      low: all.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 10).length,
      out: all.filter((p) => (p.stock ?? 0) <= 0).length,
      active: all.filter((p) => p.isActive).length,
      inactive: all.filter((p) => !p.isActive).length,
    }),
    [all],
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = all.filter((p) => {
      if (q && !`${p.name} ${categoryName(p.category)}`.toLowerCase().includes(q)) return false
      if (status === 'active' && !p.isActive) return false
      if (status === 'inactive' && p.isActive) return false
      const s = p.stock ?? 0
      if (stock === 'out' && s > 0) return false
      if (stock === 'low' && !(s > 0 && s < 10)) return false
      if (stock === 'in_stock' && s < 10) return false
      return true
    })

    if (sort) {
      const dir = sort.dir === 'asc' ? 1 : -1
      rows = [...rows].sort((a, b) => dir * compare(a, b, sort.id))
    }
    return rows
  }, [all, query, status, stock, sort])

  // Any filter change can shorten the list past the current page.
  React.useEffect(() => setPage(1), [query, status, stock, pageSize])

  const paged = React.useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  )

  const columns = useProductColumns()
  const { visible, menu } = useColumnVisibility(columns, 'merchant.products')

  const filtersActive = query !== '' || stock !== 'all' || status !== 'all'
  const clearFilters = () => {
    setQuery('')
    setStock('all')
    setStatus('all')
  }

  return (
    <Page>
      <PageHeader
        title="المنتجات"
        description="كل ما يعرضه متجرك، ومخزونه، وحالة نشره."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => products.refetch()}
              loading={products.isFetching && !products.isLoading}
              aria-label="تحديث"
            >
              <RefreshCw />
              تحديث
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportCsv(
                  selected.length ? filtered.filter((p) => selected.includes(p._id)) : filtered,
                )
              }
              disabled={filtered.length === 0}
            >
              <Download />
              تصدير
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/merchant/products/new">
                <Plus />
                منتج جديد
              </Link>
            </Button>
          </>
        }
      />

      <PageBody variant="flush">
        {products.isError ? (
          <ErrorState size="page" onRetry={() => products.refetch()} />
        ) : (
          <Section variant="panel" flush className="m-4 rounded-lg">
            <Toolbar>
              <SearchInput
                value={query}
                onValueChange={setQuery}
                placeholder="ابحث بالاسم أو التصنيف…"
                className="w-full max-w-64"
              />
              <ToolbarDivider />
              <Filter
                label="الحالة"
                value={status}
                onValueChange={(v) => setStatus(v as StatusFilter)}
                options={[
                  { value: 'all', label: 'الكل', count: counts.all },
                  { value: 'active', label: 'منشور', count: counts.active },
                  { value: 'inactive', label: 'غير منشور', count: counts.inactive },
                ]}
              />
              <Filter
                label="المخزون"
                value={stock}
                onValueChange={(v) => setStock(v as StockFilter)}
                options={[
                  { value: 'all', label: 'الكل', count: counts.all },
                  { value: 'in_stock', label: 'متوفر', count: counts.inStock },
                  { value: 'low', label: 'منخفض', count: counts.low },
                  { value: 'out', label: 'نفد', count: counts.out },
                ]}
              />
              {filtersActive && <ClearFilters onClear={clearFilters} />}

              <ToolbarSpacer />

              <SegmentedControl
                value={density}
                onValueChange={setDensity}
                options={[
                  { value: 'compact', label: 'مضغوط', title: 'صفوف مضغوطة' },
                  { value: 'comfortable', label: 'مريح', title: 'صفوف مريحة' },
                ]}
              />
              {menu}
            </Toolbar>

            <ProductsTable
              data={paged}
              columns={columns}
              visibleColumns={visible}
              loading={products.isLoading}
              density={density}
              sort={sort}
              onSortChange={setSort}
              selection={{ selected, onChange: setSelected }}
              actions={actions}
              empty={
                filtersActive ? (
                  <EmptyState
                    title="لا توجد منتجات مطابقة"
                    description="جرّب توسيع البحث أو مسح الفلاتر."
                    action={
                      <Button variant="secondary" size="sm" onClick={clearFilters}>
                        مسح الفلاتر
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<Package className="size-4" />}
                    title="لا توجد منتجات بعد"
                    description="أضف أول منتج ليظهر لعملائك في التطبيق."
                    action={
                      <Button variant="primary" size="sm" asChild>
                        <Link href="/merchant/products/new">
                          <Plus />
                          منتج جديد
                        </Link>
                      </Button>
                    }
                  />
                )
              }
            />

            {filtered.length > 0 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizes={PAGE_SIZES}
              />
            )}
          </Section>
        )}
      </PageBody>
    </Page>
  )
}

/* -------------------------------------------------------------------------- */

function compare(a: MerchantProduct, b: MerchantProduct, id: string): number {
  switch (id) {
    case 'name':
      return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ar')
    case 'category':
      return categoryName(a.category).localeCompare(categoryName(b.category), 'ar')
    case 'price':
      return sellingPrice(a) - sellingPrice(b)
    case 'stock':
      return (a.stock ?? 0) - (b.stock ?? 0)
    case 'status':
      return Number(a.isActive) - Number(b.isActive)
    case 'updatedAt':
    default:
      return new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime()
  }
}

/** RFC 4180 escaping — product names routinely contain commas and quotes. */
function csvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCsv(rows: MerchantProduct[]) {
  const header = [
    'اسم المنتج',
    'التصنيف',
    'السعر الأصلي',
    'السعر النهائي',
    'المخزون',
    'الحالة',
    'تاريخ الإنشاء',
  ]
  const csv = [
    header.map(csvField).join(','),
    ...rows.map((p) =>
      [
        p.name,
        categoryName(p.category),
        p.price,
        sellingPrice(p),
        p.stock,
        p.isActive ? 'منشور' : 'غير منشور',
        new Date(p.createdAt).toLocaleDateString('en-CA'),
      ]
        .map(csvField)
        .join(','),
    ),
  ].join('\n')

  // BOM so Excel opens the Arabic headers as UTF-8 rather than mojibake.
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `products_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
