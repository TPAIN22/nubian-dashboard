'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, Eye, MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from 'lucide-react'

import {
  Button,
  CellEmpty,
  CellTitle,
  Code,
  DataTable,
  DetailRow,
  Divider,
  StatusBadge,
  type Column,
  type SortDir,
} from '@/components/admin'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  discountPercentage,
  finalAmount,
  formatFinalPrice,
  formatOriginalPrice,
  hasDiscount as productHasDiscount,
  originalAmount,
} from '@/features/products/types/product'
import {
  merchantKeys,
  merchantRequest,
  useInvalidateMerchant,
  type MerchantProduct,
} from '@/features/merchant/api'

/* ============================================================================
   Products table
   ----------------------------------------------------------------------------
   Rows and row actions only — search, filters, sorting and paging belong to the
   page. What used to be 880 lines of hand-rolled TanStack table with its own
   toolbar, its own pagination and its own column menu is now a column array
   handed to the shared <DataTable>.
   ========================================================================== */

export function categoryName(category: MerchantProduct['category']): string {
  if (category && typeof category === 'object' && 'name' in category) {
    return category.name || ''
  }
  return typeof category === 'string' ? category : ''
}

/**
 * Price the customer is charged.
 *
 * This used to read `p.discountPrice ?? p.price`. `discountPrice` is not in the
 * schema, and `p.price` is the Money envelope **object**, so `Number.isFinite`
 * failed on both and every row rendered 0. The enriched payload already carries
 * `price.final.amount` / `finalPrice`.
 */
export function sellingPrice(p: MerchantProduct): number {
  return finalAmount(p)
}

/** Strikethrough "was" price — `originalPrice`, never `merchantPrice` (cost). */
export function originalPrice(p: MerchantProduct): number {
  return originalAmount(p)
}

/** The backend's own predicate. `finalPrice < merchantPrice` can never be true. */
export const hasDiscount = (p: MerchantProduct) => productHasDiscount(p)

/** Stock is the number a merchant scans for, so it gets a tone, not just a value. */
function stockTone(stock: number) {
  if (stock <= 0) return 'text-tone-danger-fg'
  if (stock < 10) return 'text-tone-warning-fg'
  return 'text-foreground'
}

/* ============================================================================
   Mutations
   ========================================================================== */

export type ProductActions = ReturnType<typeof useProductActions>

export function useProductActions() {
  const invalidate = useInvalidateMerchant()
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const refresh = React.useCallback(
    () => invalidate([merchantKeys.products, merchantKeys.stats]),
    [invalidate],
  )

  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      merchantRequest(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: async (_data, { isActive }) => {
      await refresh()
      toast.success(isActive ? 'تم نشر المنتج' : 'تم إخفاء المنتج')
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر تحديث حالة المنتج'),
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      merchantRequest(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: async () => {
      await refresh()
      toast.success('تم حذف المنتج')
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر حذف المنتج'),
  })

  /**
   * Bulk writes settle individually rather than with `Promise.all`. With `all`,
   * one rejected request discarded the outcome of every other one — the
   * merchant saw a bare "فشل" and had no idea which half of their selection had
   * actually gone through.
   */
  const bulkSetActive = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      summarize(
        await Promise.allSettled(
          ids.map((id) =>
            merchantRequest(`/api/products/${encodeURIComponent(id)}`, {
              method: 'PATCH',
              body: JSON.stringify({ isActive }),
            }),
          ),
        ),
      ),
    onSuccess: async ({ ok, failed }, { isActive }) => {
      await refresh()
      report(ok, failed, isActive ? 'نشر' : 'إخفاء')
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر تحديث المنتجات'),
  })

  const bulkRemove = useMutation({
    mutationFn: async (ids: string[]) =>
      summarize(
        await Promise.allSettled(
          ids.map((id) =>
            merchantRequest(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
          ),
        ),
      ),
    onSuccess: async ({ ok, failed }) => {
      await refresh()
      report(ok, failed, 'حذف')
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر حذف المنتجات'),
  })

  return { busyId, setActive, remove, bulkSetActive, bulkRemove }
}

function summarize(results: PromiseSettledResult<unknown>[]) {
  const ok = results.filter((r) => r.status === 'fulfilled').length
  return { ok, failed: results.length - ok }
}

function report(ok: number, failed: number, verb: string) {
  if (ok) toast.success(`تم ${verb} ${ok} منتج`)
  if (failed) toast.error(`تعذر ${verb} ${failed} منتج`)
}

/* ============================================================================
   Row action dialogs
   ----------------------------------------------------------------------------
   A <td> is a bad place for a modal, so the dialogs are rendered once by
   <ProductsTable> and opened through context.

   Mutations reach the cells the same way. Threading `actions` in as an argument
   would defeat the point of memoising the columns: react-query hands back a new
   object on every render, so the column array — and with it the visibility
   menu's memo — would rebuild on each keystroke. Through context the array has
   no dependencies at all.
   ========================================================================== */

type RowDialogs = {
  preview: (p: MerchantProduct) => void
  confirmDelete: (p: MerchantProduct) => void
}

const RowDialogCtx = React.createContext<RowDialogs | null>(null)
const ActionsCtx = React.createContext<ProductActions | null>(null)

/* ============================================================================
   Columns
   ========================================================================== */

export function useProductColumns(): Column<MerchantProduct>[] {
  return React.useMemo<Column<MerchantProduct>[]>(
    () => [
      {
        id: 'name',
        header: 'المنتج',
        sortable: true,
        hideable: false,
        cell: (p) => (
          <CellTitle
            media={<Thumb product={p} />}
            title={p.name || 'بدون اسم'}
            subtitle={categoryName(p.category) || 'بدون تصنيف'}
          />
        ),
      },
      {
        id: 'category',
        header: 'التصنيف',
        width: '160px',
        sortable: true,
        defaultHidden: true,
        cell: (p) => categoryName(p.category) || <CellEmpty />,
      },
      {
        // The id stays 'price': the page's `compare()` sorts this column
        // through `sellingPrice()`, which now resolves a real number.
        id: 'price',
        header: 'السعر',
        width: '150px',
        align: 'end',
        sortable: true,
        cell: (p) => (
          <span className="inline-flex items-baseline gap-1.5">
            {hasDiscount(p) && (
              <span className="text-[11px] text-text-faint line-through">
                {formatOriginalPrice(p)}
              </span>
            )}
            <span className="font-medium">{formatFinalPrice(p)}</span>
          </span>
        ),
      },
      {
        id: 'stock',
        header: 'المخزون',
        width: '90px',
        align: 'end',
        sortable: true,
        cell: (p) => {
          const stock = p.stock ?? 0
          return <span className={cn('font-medium', stockTone(stock))}>{stock}</span>
        },
      },
      {
        id: 'status',
        header: 'الحالة',
        width: '160px',
        sortable: true,
        truncate: false,
        cell: (p) => <StatusCell product={p} />,
      },
      {
        id: 'updatedAt',
        header: 'آخر تحديث',
        width: '120px',
        sortable: true,
        cell: (p) =>
          p.updatedAt ? (
            <span className="text-text-muted nums">
              {new Date(p.updatedAt).toLocaleDateString('en-CA')}
            </span>
          ) : (
            <CellEmpty />
          ),
      },
      {
        id: 'actions',
        header: '',
        width: '48px',
        align: 'center',
        hideable: false,
        truncate: false,
        cell: (p) => <RowActions product={p} />,
      },
    ],
    [],
  )
}

function StatusCell({ product }: { product: MerchantProduct }) {
  const actions = React.useContext(ActionsCtx)
  if (!actions) return null

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={product.isActive}
        disabled={actions.busyId === product._id}
        onCheckedChange={(next) =>
          actions.setActive.mutate({ id: product._id, isActive: Boolean(next) })
        }
        aria-label={product.isActive ? 'إخفاء المنتج' : 'نشر المنتج'}
        className="scale-90"
      />
      <StatusBadge
        tone={product.isActive ? 'success' : 'neutral'}
        label={product.isActive ? 'منشور' : 'غير منشور'}
      />
    </div>
  )
}

function RowActions({ product }: { product: MerchantProduct }) {
  const router = useRouter()
  const dialogs = React.useContext(RowDialogCtx)

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="إجراءات المنتج">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem className="text-[12px]" onSelect={() => dialogs?.preview(product)}>
            <Eye className="size-3.5" />
            عرض التفاصيل
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[12px]"
            onSelect={() => router.push(`/merchant/products/${product._id}/edit`)}
          >
            <Pencil className="size-3.5" />
            تعديل
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[12px]"
            onSelect={() => {
              navigator.clipboard?.writeText(product._id)
              toast.success('تم نسخ معرف المنتج')
            }}
          >
            <Copy className="size-3.5" />
            نسخ المعرف
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[12px] text-tone-danger-fg focus:text-tone-danger-fg"
            onSelect={() => dialogs?.confirmDelete(product)}
          >
            <Trash2 className="size-3.5" />
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* ============================================================================
   Table
   ========================================================================== */

export function ProductsTable({
  data,
  columns,
  visibleColumns,
  loading,
  density = 'compact',
  sort,
  onSortChange,
  selection,
  actions,
  empty,
}: {
  data: MerchantProduct[]
  columns: Column<MerchantProduct>[]
  visibleColumns?: Column<MerchantProduct>[]
  loading?: boolean
  density?: 'compact' | 'comfortable'
  sort: { id: string; dir: SortDir } | null
  onSortChange: (next: { id: string; dir: SortDir } | null) => void
  selection: { selected: string[]; onChange: (ids: string[]) => void }
  actions: ProductActions
  empty?: React.ReactNode
}) {
  const router = useRouter()
  const [preview, setPreview] = React.useState<MerchantProduct | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<MerchantProduct | null>(null)
  const [bulkDelete, setBulkDelete] = React.useState<string[] | null>(null)

  const dialogs = React.useMemo<RowDialogs>(
    () => ({ preview: setPreview, confirmDelete: setPendingDelete }),
    [],
  )

  return (
    <ActionsCtx.Provider value={actions}>
      <RowDialogCtx.Provider value={dialogs}>
        <DataTable
          data={data}
          columns={columns}
          visibleColumns={visibleColumns}
          getRowId={(p) => p._id}
          loading={loading}
          empty={empty}
          sort={sort}
          onSortChange={onSortChange}
          selection={selection}
          onRowClick={(p) => router.push(`/merchant/products/${p._id}/edit`)}
          rowAccent={(p) => ((p.stock ?? 0) <= 0 ? 'bg-tone-danger-fg' : undefined)}
          className={cn(density === 'comfortable' && '[&_tbody_td]:h-12')}
          bulkActions={(ids) => (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={actions.bulkSetActive.isPending}
                onClick={() => {
                  actions.bulkSetActive.mutate({ ids, isActive: true })
                  selection.onChange([])
                }}
              >
                <Power />
                نشر
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={actions.bulkSetActive.isPending}
                onClick={() => {
                  actions.bulkSetActive.mutate({ ids, isActive: false })
                  selection.onChange([])
                }}
              >
                <PowerOff />
                إخفاء
              </Button>
              <Button
                variant="danger-subtle"
                size="sm"
                disabled={actions.bulkRemove.isPending}
                onClick={() => setBulkDelete(ids)}
              >
                <Trash2 />
                حذف
              </Button>
            </>
          )}
        />

        <ProductPreview product={preview} onClose={() => setPreview(null)} />

        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title="حذف المنتج؟"
          description={
            <>
              سيتم حذف &laquo;{pendingDelete?.name}&raquo; نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </>
          }
          pending={actions.remove.isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            if (pendingDelete) actions.remove.mutate(pendingDelete._id)
            setPendingDelete(null)
          }}
        />

        <ConfirmDialog
          open={Boolean(bulkDelete)}
          title="حذف المنتجات المحددة؟"
          description={`سيتم حذف ${bulkDelete?.length ?? 0} منتج نهائياً. لا يمكن التراجع عن هذا الإجراء.`}
          pending={actions.bulkRemove.isPending}
          onCancel={() => setBulkDelete(null)}
          onConfirm={() => {
            if (bulkDelete) actions.bulkRemove.mutate(bulkDelete)
            setBulkDelete(null)
            selection.onChange([])
          }}
        />
      </RowDialogCtx.Provider>
    </ActionsCtx.Provider>
  )
}

/* ============================================================================
   Pieces
   ========================================================================== */

function Thumb({ product, size = 28 }: { product: MerchantProduct; size?: number }) {
  const src = product.images?.[0]
  if (!src) {
    return (
      <span
        aria-hidden
        className="grid shrink-0 place-items-center rounded-[5px] border border-border bg-canvas text-text-faint"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor">
          <rect x="2" y="3" width="12" height="10" rx="1.5" strokeWidth="1.2" />
          <path d="m4 11 2.5-3 2 2L11 7l1 1.5" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-[5px] border border-border bg-canvas"
      style={{ width: size, height: size }}
    >
      <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
    </span>
  )
}

function ProductPreview({
  product,
  onClose,
}: {
  product: MerchantProduct | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {product && (
          <>
            <DialogHeader>
              <DialogTitle className="text-[15px]">{product.name}</DialogTitle>
              <DialogDescription asChild>
                <div className="text-[12px]">
                  <Code>{product._id}</Code>
                </div>
              </DialogDescription>
            </DialogHeader>

            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 8).map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-md border border-border bg-canvas"
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      sizes="120px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}

            <dl className="mt-1">
              <DetailRow label="السعر النهائي">{formatFinalPrice(product)}</DetailRow>
              {hasDiscount(product) && (
                <DetailRow label="السعر الأصلي">
                  <span className="inline-flex items-baseline gap-1.5">
                    <span className="line-through">{formatOriginalPrice(product)}</span>
                    {discountPercentage(product) > 0 && (
                      <span className="text-tone-danger-fg">
                        خصم {discountPercentage(product)}%
                      </span>
                    )}
                  </span>
                </DetailRow>
              )}
              <DetailRow label="المخزون">
                <span className={stockTone(product.stock ?? 0)}>{product.stock ?? 0}</span>
              </DetailRow>
              <DetailRow label="التصنيف">{categoryName(product.category) || '—'}</DetailRow>
              <DetailRow label="الحالة">
                <StatusBadge
                  tone={product.isActive ? 'success' : 'neutral'}
                  label={product.isActive ? 'منشور' : 'غير منشور'}
                />
              </DetailRow>
              {product.sizes && product.sizes.length > 0 && (
                <DetailRow label="المقاسات">{product.sizes.join('، ')}</DetailRow>
              )}
              <DetailRow label="أُنشئ في">
                {new Date(product.createdAt).toLocaleDateString('en-CA')}
              </DetailRow>
            </dl>

            {product.description && (
              <>
                <Divider label="الوصف" className="my-1" />
                <p className="text-[12px] leading-5 whitespace-pre-line text-text-muted">
                  {product.description}
                </p>
              </>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                إغلاق
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href={`/merchant/products/${product._id}/edit`}>تعديل المنتج</Link>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDialog({
  open,
  title,
  description,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: React.ReactNode
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:opacity-90"
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
