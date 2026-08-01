'use client'

import * as React from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { Gift, MoreHorizontal, Plus } from 'lucide-react'

import { axiosInstance } from '@/lib/axiosInstance'
import { formatCurrency } from '@/lib/currency'
import {
  Button,
  Code,
  DataTable,
  EmptyState,
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
} from '@/components/admin'
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CouponForm from './couponForm'

/* ============================================================================
   Coupons
   ----------------------------------------------------------------------------
   Unchanged API surface: GET /coupons (with isActive / expired params),
   PATCH /coupons/:id/deactivate, DELETE /coupons/:id, and the existing
   CouponForm dialog for create/edit.

   Fixed while rebuilding: delete used a native `confirm()`, and every row
   carried three always-visible buttons — 3 buttons × N rows is a wall of
   chrome. Actions now live in a row menu, and delete goes through the app's
   own confirm dialog so it can state what actually happens.
   ========================================================================== */

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  } catch {
    return dateString
  }
}

interface Coupon {
  _id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderAmount: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimitPerUser: number
  usageLimitGlobal?: number
  usageCount: number
  totalDiscountGiven: number
  totalOrders: number
  applicableProducts: unknown[]
  applicableCategories: unknown[]
  applicableMerchants: unknown[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function CouponsPage() {
  const { getToken } = useAuth()
  const [coupons, setCoupons] = React.useState<Coupon[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterActive, setFilterActive] = React.useState('all')
  const [selectedCoupon, setSelectedCoupon] = React.useState<Coupon | null>(null)
  const [showForm, setShowForm] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState<Coupon | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const fetchCoupons = React.useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const params = new URLSearchParams()
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false')
      }
      if (filterActive === 'expired') {
        params.append('expired', 'true')
      }

      const response = await axiosInstance.get(`/coupons?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setCoupons(response.data?.success ? response.data.data || [] : response.data || [])
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error('فشل تحميل الكوبونات', {
        description: err.response?.data?.message || err.message,
      })
    } finally {
      setLoading(false)
    }
  }, [getToken, filterActive])

  React.useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const handleCreate = () => {
    setSelectedCoupon(null)
    setShowForm(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setShowForm(true)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const token = await getToken()
      await axiosInstance.delete(`/coupons/${pendingDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('تم حذف الكوبون بنجاح')
      setPendingDelete(null)
      fetchCoupons()
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error('فشل حذف الكوبون', {
        description: err.response?.data?.message || err.message,
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeactivate = async (couponId: string) => {
    try {
      const token = await getToken()
      await axiosInstance.patch(
        `/coupons/${couponId}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('تم تعطيل الكوبون بنجاح')
      fetchCoupons()
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error('فشل تعطيل الكوبون', {
        description: err.response?.data?.message || err.message,
      })
    }
  }

  const filteredCoupons = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return coupons
    return coupons.filter((c) => c.code.toLowerCase().includes(q))
  }, [coupons, searchQuery])

  const columns = React.useMemo<Column<Coupon>[]>(
    () => [
      {
        id: 'code',
        header: 'الكود',
        width: '150px',
        cell: (c) => <Code className="font-semibold text-foreground">{c.code}</Code>,
      },
      {
        id: 'value',
        header: 'الخصم',
        width: '110px',
        cell: (c) => (
          <span className="font-medium">
            {c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}
          </span>
        ),
      },
      {
        id: 'minOrderAmount',
        header: 'الحد الأدنى للطلب',
        width: '130px',
        align: 'end',
        cell: (c) =>
          c.minOrderAmount > 0 ? (
            formatCurrency(c.minOrderAmount)
          ) : (
            <span className="text-text-faint">—</span>
          ),
      },
      {
        id: 'usage',
        header: 'الاستخدام',
        width: '110px',
        cell: (c) => (
          <span className="nums">
            {c.usageCount || 0}
            <span className="text-text-faint"> / {c.usageLimitGlobal || '∞'}</span>
          </span>
        ),
      },
      {
        id: 'period',
        header: 'الفترة',
        width: '180px',
        cell: (c) => (
          <span className="whitespace-nowrap text-text-muted nums" dir="ltr">
            {formatDate(c.startDate)} → {formatDate(c.endDate)}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'الحالة',
        width: '110px',
        cell: (c) => {
          const expired = new Date(c.endDate) < new Date()
          const active = c.isActive && !expired
          return (
            <StatusBadge
              tone={active ? 'success' : expired ? 'danger' : 'neutral'}
              label={active ? 'نشط' : expired ? 'منتهي' : 'معطل'}
            />
          )
        },
      },
      {
        id: 'totalDiscountGiven',
        header: 'إجمالي الخصم الممنوح',
        width: '150px',
        align: 'end',
        defaultHidden: true,
        cell: (c) => formatCurrency(c.totalDiscountGiven || 0),
      },
      {
        id: 'totalOrders',
        header: 'الطلبات',
        width: '90px',
        align: 'end',
        defaultHidden: true,
        cell: (c) => c.totalOrders || 0,
      },
      {
        id: 'actions',
        header: '',
        width: '48px',
        align: 'center',
        hideable: false,
        truncate: false,
        cell: (c) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`عمليات الكوبون ${c.code}`}
                className="grid size-6 place-items-center rounded-[5px] text-text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-canvas-hover hover:text-foreground focus-visible:opacity-100 focus-ring"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-[12px]" onClick={() => handleEdit(c)}>
                تعديل
              </DropdownMenuItem>
              {c.isActive && (
                <DropdownMenuItem
                  className="text-[12px]"
                  onClick={() => handleDeactivate(c._id)}
                >
                  تعطيل
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[12px] text-tone-danger-fg"
                onClick={() => setPendingDelete(c)}
              >
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const { visible, menu } = useColumnVisibility(columns, 'admin-coupons')

  return (
    <Page>
      <PageHeader
        title="الكوبونات"
        description="إنشاء وإدارة كوبونات الخصم وحدود استخدامها."
        actions={
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <Plus />
            كوبون جديد
          </Button>
        }
        tabs={
          <ViewTabs
            tabs={[
              { id: 'all', label: 'الكل' },
              { id: 'active', label: 'نشط' },
              { id: 'expired', label: 'منتهي' },
            ]}
            value={filterActive}
            onValueChange={setFilterActive}
          />
        }
      />

      <PageBody variant="flush">
        <Toolbar>
          <SearchInput
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="بحث بكود الكوبون…"
            className="w-full max-w-xs"
          />
          <ToolbarSpacer />
          <ToolbarDivider />
          {menu}
        </Toolbar>

        <DataTable
          data={filteredCoupons}
          columns={columns}
          visibleColumns={visible}
          getRowId={(c) => c._id}
          loading={loading}
          onRowClick={handleEdit}
          empty={
            <EmptyState
              icon={<Gift className="size-4" />}
              title={searchQuery ? 'لا كوبونات مطابقة' : 'لا توجد كوبونات'}
              description={
                searchQuery
                  ? 'لم يطابق أي كوبون هذا الكود.'
                  : 'أنشئ كوبون خصم لتشغيل حملة تسويقية أو مكافأة عملاء.'
              }
              action={
                searchQuery ? (
                  <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                    مسح البحث
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleCreate}>
                    <Plus />
                    إنشاء كوبون
                  </Button>
                )
              }
            />
          }
        />
      </PageBody>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCoupon ? 'تعديل الكوبون' : 'كوبون جديد'}</DialogTitle>
            <DialogDescription>
              {selectedCoupon
                ? 'قم بتعديل بيانات الكوبون'
                : 'املأ البيانات لإنشاء كوبون خصم جديد'}
            </DialogDescription>
          </DialogHeader>
          <CouponForm
            coupon={selectedCoupon}
            onSuccess={() => {
              setShowForm(false)
              setSelectedCoupon(null)
              fetchCoupons()
            }}
            onCancel={() => {
              setShowForm(false)
              setSelectedCoupon(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        variant="destructive"
        loading={deleting}
        confirmText="حذف الكوبون"
        title={`حذف الكوبون «${pendingDelete?.code ?? ''}»؟`}
        description="لن يعود بالإمكان استخدام هذا الكود. الطلبات التي استخدمته سابقاً لا تتأثر. لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
      />
    </Page>
  )
}
