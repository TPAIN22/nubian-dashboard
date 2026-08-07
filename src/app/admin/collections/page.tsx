'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, LayoutList, PlusCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@clerk/nextjs'

import { axiosInstance } from '@/lib/axiosInstance'
import {
  Button,
  CellTitle,
  DataTable,
  EmptyState,
  Page,
  PageBody,
  PageHeader,
  Section,
  StatusBadge,
  type Column,
} from '@/components/admin'
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import type { CollectionSummary } from '@/lib/collection'

/* ============================================================================
   Collections
   ----------------------------------------------------------------------------
   GET /collections/admin/all (bearer) — the admin listing, unlike the public
   one, includes inactive collections.
   ========================================================================== */

const THUMB = 40

export default function CollectionsPage() {
  const { getToken } = useAuth()
  const router = useRouter()

  const [collections, setCollections] = React.useState<CollectionSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [pendingDelete, setPendingDelete] = React.useState<CollectionSummary | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const fetchCollections = React.useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await axiosInstance.get('/collections/admin/all?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = res.data?.data ?? res.data ?? []
      setCollections(Array.isArray(data) ? data : [])
    } catch (e) {
      const err = e as { formattedMessage?: string; message?: string }
      toast.error('فشل في جلب المجموعات', {
        description: err.formattedMessage || err.message || 'حدث خطأ غير معروف',
      })
      setCollections([])
    } finally {
      setLoading(false)
    }
  }, [getToken])

  React.useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const token = await getToken()
      await axiosInstance.delete(`/collections/${pendingDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('تم حذف المجموعة')
      setPendingDelete(null)
      fetchCollections()
    } catch (e) {
      // The API refuses to delete a collection a banner still points at, so the
      // server's message ("used by N banners") is the useful one here.
      const err = e as { formattedMessage?: string; message?: string }
      toast.error('فشل حذف المجموعة', {
        description: err.formattedMessage || err.message || 'حدث خطأ غير معروف',
      })
    } finally {
      setDeleting(false)
    }
  }

  const columns = React.useMemo<Column<CollectionSummary>[]>(
    () => [
      {
        id: 'image',
        header: 'الصورة',
        width: '70px',
        truncate: false,
        cell: (c) =>
          c.image ? (
            <Image
              src={c.image}
              alt=""
              width={THUMB}
              height={THUMB}
              unoptimized
              className="rounded-[4px] border border-border object-cover"
            />
          ) : (
            <div
              style={{ width: THUMB, height: THUMB }}
              className="grid place-items-center rounded-[4px] border border-border bg-canvas text-text-faint"
            >
              <LayoutList className="size-3.5" />
            </div>
          ),
      },
      {
        id: 'name',
        header: 'الاسم',
        width: 'minmax(220px, 1fr)',
        cell: (c) => <CellTitle title={c.name} subtitle={c.slug} />,
      },
      {
        id: 'products',
        header: 'المنتجات',
        width: '110px',
        align: 'end',
        cell: (c) => c.productCount ?? 0,
      },
      {
        id: 'isActive',
        header: 'الحالة',
        width: '110px',
        cell: (c) => (
          <StatusBadge
            tone={c.isActive ? 'success' : 'neutral'}
            label={c.isActive ? 'مفعلة' : 'معطلة'}
          />
        ),
      },
      {
        id: 'sortOrder',
        header: 'الترتيب',
        width: '90px',
        align: 'end',
        cell: (c) => c.sortOrder ?? 0,
      },
      {
        id: 'updatedAt',
        header: 'آخر تحديث',
        width: '130px',
        cell: (c) =>
          c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ar-EG') : '—',
      },
      {
        id: 'actions',
        header: '',
        width: '90px',
        align: 'end',
        hideable: false,
        truncate: false,
        cell: (c) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`تعديل ${c.name}`}
              onClick={() => router.push(`/admin/collections/edit/${c._id}`)}
            >
              <Edit />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`حذف ${c.name}`}
              className="text-text-faint hover:text-tone-danger-fg"
              onClick={() => setPendingDelete(c)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    [router],
  )

  return (
    <Page>
      <PageHeader
        title="المجموعات"
        description="قوائم منتجات منسّقة يدوياً — يمكن ربط البانرات بها."
        actions={
          <Button variant="primary" size="sm" asChild>
            <Link href="/admin/collections/new">
              <PlusCircle />
              مجموعة جديدة
            </Link>
          </Button>
        }
      />

      <PageBody>
        <Section variant="panel" flush>
          <DataTable
            data={collections}
            columns={columns}
            getRowId={(c) => c._id}
            loading={loading}
            onRowClick={(c) => router.push(`/admin/collections/edit/${c._id}`)}
            empty={
              <EmptyState
                icon={<LayoutList className="size-4" />}
                title="لا توجد مجموعات"
                description="أنشئ مجموعة منسّقة مثل «مفضلات رمضان»، ثم اربط بها بانراً في الصفحة الرئيسية."
                action={
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/admin/collections/new">
                      <PlusCircle />
                      إنشاء مجموعة
                    </Link>
                  </Button>
                }
              />
            }
          />
        </Section>
      </PageBody>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        variant="destructive"
        loading={deleting}
        confirmText="حذف المجموعة"
        title="حذف هذه المجموعة؟"
        description="سيتم حذف المجموعة فقط — المنتجات بداخلها لن تُحذف وستبقى في المتجر كما هي."
        onConfirm={confirmDelete}
      />
    </Page>
  )
}
