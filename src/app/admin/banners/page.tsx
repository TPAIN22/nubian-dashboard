'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Edit, Image as ImageIcon, PlusCircle, Trash2 } from 'lucide-react'
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
import BannerForm from './bannerForm'
import type { BannerFormValues } from './bannerForm'

type Banner = BannerFormValues & { _id: string }

/* ============================================================================
   Banners
   ----------------------------------------------------------------------------
   Same endpoints: GET /banners, DELETE /banners/:id (bearer), and the existing
   BannerForm for create/edit.

   Fixed while rebuilding:
     · The table header was hardcoded `bg-gray-600` with `divide-gray-500` — a
       dark grey band that ignored the theme entirely in light mode.
     · Thumbnails used a bare <img>, shipping a full-size banner into a small
       box on every row. Now next/image at fixed dimensions.
     · Delete used `window.confirm`; it now uses the app's confirm dialog.
     · Active state was a raw ✅/❌ glyph; now a real status badge.
   ========================================================================== */

const THUMB_W = 84
const THUMB_H = 40

export default function BannersPage() {
  const { getToken } = useAuth()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/banners')
      // Handle both a bare array and the wrapped envelope.
      const data = Array.isArray(res.data) ? res.data : res.data?.data || []
      setBanners(Array.isArray(data) ? data : [])
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      const message = err?.response?.data?.message || err?.message || 'حدث خطأ غير معروف'
      toast.error('فشل في جلب العروض', {
        description: typeof message === 'string' ? message : 'حدث خطأ غير معروف',
      })
      setBanners([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const token = await getToken()
      await axiosInstance.delete(`/banners/${pendingDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('تم حذف العرض بنجاح')
      setPendingDelete(null)
      fetchBanners()
    } catch (e) {
      toast.error('فشل حذف العرض', {
        description: e instanceof Error ? e.message : 'حدث خطأ غير معروف',
      })
    } finally {
      setDeleting(false)
    }
  }

  const openEditor = (banner: Banner | null) => {
    setEditBanner(banner)
    setShowForm(true)
  }

  const columns = React.useMemo<Column<Banner>[]>(
    () => [
      {
        id: 'image',
        header: 'الصورة',
        width: '110px',
        truncate: false,
        cell: (b) =>
          b.image ? (
            <Image
              src={b.image}
              alt=""
              width={THUMB_W}
              height={THUMB_H}
              unoptimized
              className="rounded-[4px] border border-border object-cover"
            />
          ) : (
            <div
              style={{ width: THUMB_W, height: THUMB_H }}
              className="grid place-items-center rounded-[4px] border border-border bg-canvas text-text-faint"
            >
              <ImageIcon className="size-3.5" />
            </div>
          ),
      },
      {
        id: 'title',
        header: 'العنوان',
        width: 'minmax(220px, 1fr)',
        cell: (b) => <CellTitle title={b.title || '—'} subtitle={b.description} />,
      },
      {
        id: 'order',
        header: 'الترتيب',
        width: '90px',
        align: 'end',
        cell: (b) => b.order ?? 0,
      },
      {
        id: 'isActive',
        header: 'الحالة',
        width: '110px',
        cell: (b) => (
          <StatusBadge
            tone={b.isActive ? 'success' : 'neutral'}
            label={b.isActive ? 'مفعل' : 'معطل'}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        width: '90px',
        align: 'end',
        hideable: false,
        truncate: false,
        cell: (b) => (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`تعديل ${b.title || 'العرض'}`}
              onClick={() => openEditor(b)}
            >
              <Edit />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`حذف ${b.title || 'العرض'}`}
              className="text-text-faint hover:text-tone-danger-fg"
              onClick={() => setPendingDelete(b)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <Page>
      <PageHeader
        title="العروض والبانرات"
        description="الصور الترويجية التي تظهر في أعلى التطبيق."
        actions={
          <Button variant="primary" size="sm" onClick={() => openEditor(null)}>
            <PlusCircle />
            عرض جديد
          </Button>
        }
      />

      <PageBody>
        {showForm && (
          <Section
            title={editBanner ? 'تعديل العرض' : 'عرض جديد'}
            variant="panel"
            className="mb-5"
          >
            <BannerForm
              banner={editBanner || undefined}
              onClose={() => {
                setShowForm(false)
                setEditBanner(null)
                fetchBanners()
              }}
            />
          </Section>
        )}

        <Section variant="panel" flush>
          <DataTable
            data={banners}
            columns={columns}
            getRowId={(b) => b._id}
            loading={loading}
            onRowClick={openEditor}
            empty={
              <EmptyState
                icon={<ImageIcon className="size-4" />}
                title="لا توجد عروض"
                description="أضف بانراً ترويجياً ليظهر في أعلى الصفحة الرئيسية للتطبيق."
                action={
                  <Button variant="primary" size="sm" onClick={() => openEditor(null)}>
                    <PlusCircle />
                    إضافة عرض
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
        confirmText="حذف العرض"
        title="حذف هذا العرض؟"
        description="سيختفي البانر من التطبيق فوراً. لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
      />
    </Page>
  )
}
