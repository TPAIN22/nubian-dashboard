'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Trash2, UserRoundCheck } from 'lucide-react'
import { toast } from 'sonner'

import {
  Alert,
  Button,
  CellTitle,
  DataTable,
  EmptyState,
  ErrorState,
  Page,
  PageBody,
  PageHeader,
  SearchInput,
  StatusBadge,
  Toolbar,
  ToolbarDivider,
  ToolbarSpacer,
  ViewTabs,
  useColumnVisibility,
  type Column,
  type Tone,
} from '@/components/admin'
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'

/* ============================================================================
   Merchants / applications
   ----------------------------------------------------------------------------
   Same data contract as before: the full set is loaded once from
   /api/admin/applications and filtered client-side; delete hits
   DELETE /api/admin/applications/:id and removes the row optimistically.

   Three things fixed beyond the visual rebuild:
     · This was the only admin screen still in English, in an otherwise Arabic
       RTL product. Now Arabic, using the shared status vocabulary.
     · `window.confirm` / `window.alert` replaced with the app's own dialog and
       toasts — native dialogs are unstyled, untranslatable and block the tab.
     · Status colours came from a local pill map that disagreed with every other
       table; they now come from the design system's tones.
   ========================================================================== */

type MerchantStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'needs_revision'
type TabKey = 'all' | MerchantStatus

interface MerchantRow {
  _id: string
  storeName: string
  ownerName: string
  email: string
  city?: string
  merchantType: 'individual' | 'business'
  status: MerchantStatus
  createdAt: string
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'قيد المراجعة' },
  { key: 'approved', label: 'معتمد' },
  { key: 'needs_revision', label: 'يحتاج تعديل' },
  { key: 'rejected', label: 'مرفوض' },
  { key: 'suspended', label: 'موقوف' },
]

const STATUS_LABEL: Record<MerchantStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  suspended: 'موقوف',
  needs_revision: 'يحتاج تعديل',
}

const STATUS_TONE: Record<MerchantStatus, Tone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'danger',
  needs_revision: 'warning',
}

const dateFmt = new Intl.DateTimeFormat('ar-SD-u-nu-latn', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<MerchantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<MerchantRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load the full set once; filter client-side. The server still supports
      // ?status= if this list ever outgrows a single fetch.
      const res = await fetch('/api/admin/applications', { cache: 'no-store' })
      if (!res.ok) throw new Error(`استجاب الخادم بالحالة ${res.status}`)
      const data = await res.json()
      setApplications(Array.isArray(data.applications) ? data.applications : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل طلبات الانضمام')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/applications/${pendingDelete._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          body?.error?.message || body?.message || `فشل الحذف (${res.status})`,
        )
      }
      setApplications((prev) => prev.filter((m) => m._id !== pendingDelete._id))
      toast.success(`تم حذف متجر «${pendingDelete.storeName}»`)
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل حذف المتجر')
    } finally {
      setDeleting(false)
    }
  }

  const counts = useMemo(() => {
    const base: Record<TabKey, number> = {
      all: applications.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
      needs_revision: 0,
    }
    for (const app of applications) {
      if (app.status in base) base[app.status] += 1
    }
    return base
  }, [applications])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return applications.filter((app) => {
      if (activeTab !== 'all' && app.status !== activeTab) return false
      if (!q) return true
      return (
        app.storeName?.toLowerCase().includes(q) ||
        app.ownerName?.toLowerCase().includes(q) ||
        app.email?.toLowerCase().includes(q) ||
        app.city?.toLowerCase().includes(q)
      )
    })
  }, [applications, activeTab, search])

  const columns = useMemo<Column<MerchantRow>[]>(
    () => [
      {
        id: 'store',
        header: 'المتجر',
        width: '220px',
        cell: (m) => <CellTitle title={m.storeName} subtitle={m.city} />,
      },
      {
        id: 'owner',
        header: 'المالك',
        width: '220px',
        cell: (m) => (
          <CellTitle title={m.ownerName} subtitle={<span dir="ltr">{m.email}</span>} />
        ),
      },
      {
        id: 'type',
        header: 'النوع',
        width: '100px',
        cell: (m) => (
          <span className="text-text-muted">
            {m.merchantType === 'business' ? 'شركة' : 'فرد'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'الحالة',
        width: '130px',
        cell: (m) => (
          <StatusBadge tone={STATUS_TONE[m.status]} label={STATUS_LABEL[m.status] ?? m.status} />
        ),
      },
      {
        id: 'createdAt',
        header: 'تاريخ التقديم',
        width: '120px',
        cell: (m) => (
          <span className="whitespace-nowrap text-text-muted">
            {m.createdAt ? dateFmt.format(new Date(m.createdAt)) : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        width: '130px',
        align: 'end',
        hideable: false,
        truncate: false,
        cell: (m) => (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="secondary" size="xs" asChild>
              <Link href={`/admin/applications/${m._id}`}>
                {m.status === 'pending' || m.status === 'needs_revision' ? 'مراجعة' : 'عرض'}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setPendingDelete(m)}
              aria-label={`حذف ${m.storeName}`}
              title="حذف المتجر — يُعطّل كل منتجاته"
              className="text-text-faint hover:text-tone-danger-fg"
            >
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const { visible: visibleCols, menu } = useColumnVisibility(columns, 'admin-applications')

  return (
    <Page>
      <PageHeader
        title="المتاجر وطلبات الانضمام"
        description="كل المتاجر على المنصة. استخدم التبويبات للتصفية حسب الحالة."
        tabs={
          <ViewTabs
            tabs={TABS.map((t) => ({ id: t.key, label: t.label, count: counts[t.key] }))}
            value={activeTab}
            onValueChange={(id) => setActiveTab(id as TabKey)}
          />
        }
      />

      <PageBody variant="flush">
        {error ? (
          <ErrorState size="page" description={error} onRetry={load} />
        ) : (
          <>
            <Toolbar>
              <SearchInput
                value={search}
                onValueChange={setSearch}
                placeholder="بحث بالمتجر، المالك، البريد أو المدينة…"
                className="w-full max-w-xs"
              />
              <ToolbarSpacer />
              <ToolbarDivider />
              {menu}
            </Toolbar>

            <DataTable
              data={visible}
              columns={columns}
              visibleColumns={visibleCols}
              getRowId={(m) => m._id}
              loading={loading}
              empty={
                <EmptyState
                  icon={<UserRoundCheck className="size-4" />}
                  title={
                    applications.length === 0 ? 'لا توجد طلبات انضمام' : 'لا نتائج مطابقة'
                  }
                  description={
                    applications.length === 0
                      ? 'ستظهر هنا المتاجر فور تقديم أول طلب انضمام.'
                      : 'جرّب تبويباً آخر أو غيّر كلمة البحث.'
                  }
                  action={
                    applications.length > 0 ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearch('')
                          setActiveTab('all')
                        }}
                      >
                        مسح الفلاتر
                      </Button>
                    ) : undefined
                  }
                />
              }
            />
          </>
        )}
      </PageBody>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        variant="destructive"
        loading={deleting}
        confirmText="حذف نهائياً"
        title={`حذف متجر «${pendingDelete?.storeName ?? ''}»؟`}
        description={
          'سيُحذف سجل المتجر وتُعطَّل كل منتجاته. تبقى الطلبات محفوظة لأغراض التدقيق ' +
          'والاسترجاع، ويستطيع صاحب المتجر التقديم من جديد. لا يمكن التراجع عن هذا الإجراء.'
        }
        onConfirm={confirmDelete}
      />
    </Page>
  )
}
