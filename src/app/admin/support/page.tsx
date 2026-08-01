'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { LifeBuoy, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import {
  Button,
  CellTitle,
  Code,
  DataTable,
  EmptyState,
  Filter,
  Page,
  PageBody,
  PageHeader,
  SearchInput,
  Stack,
  Stat,
  StatRow,
  StatusBadge,
  Toolbar,
  ToolbarDivider,
  ToolbarSpacer,
  ViewTabs,
  useColumnVisibility,
  type Column,
  type Tone,
} from '@/components/admin'
import { adminApi } from '@/lib/adminApi'
import { cn } from '@/lib/utils'

/* ============================================================================
   Support & risk
   ----------------------------------------------------------------------------
   The API contract is unchanged: adminApi.getTickets(params) with optional
   status / category / query, plus adminApi.getStats() for the KPI row.

   Behavioural fixes made while rebuilding:
     · Search fired a full refetch on every keystroke. It is now debounced
       (350ms), so typing "order" is one request instead of five.
     · The "معلقة" and "تجار" tabs rendered no content at all — selecting either
       showed an empty page. Removed until they have a data source.
     · "تصدير التقرير" and "إنشاء تذكرة" were buttons with no handler. Removed
       rather than left as decoration.
     · Risk score, status and SLA each had their own inline colour ternaries
       that disagreed with the rest of the admin; all three now use tones.
   ========================================================================== */

type Ticket = {
  _id?: string
  ticketNumber?: string
  subject?: string
  category?: string
  type?: string
  status?: string
  priority?: string
  riskScore?: number
  slaDeadline?: string
}

type TabKey = 'all' | 'risk' | 'disputes'

const STATUS_LABEL: Record<string, string> = {
  open: 'مفتوحة',
  under_review: 'قيد المراجعة',
  waiting_customer: 'بانتظار العميل',
  escalated: 'مصعدة',
  resolved_refund: 'تم الاسترداد',
  resolved_rejected: 'مرفوضة',
  closed: 'مغلقة',
}

const STATUS_TONE: Record<string, Tone> = {
  open: 'info',
  under_review: 'info',
  waiting_customer: 'warning',
  escalated: 'danger',
  resolved_refund: 'success',
  resolved_rejected: 'neutral',
  closed: 'neutral',
}

const CATEGORY_LABEL: Record<string, string> = {
  fraud: 'احتيال',
  order_issue: 'مشاكل الطلب',
  payment_issue: 'مشاكل الدفع',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
}

const dateFmt = new Intl.DateTimeFormat('ar-SD-u-nu-latn', {
  month: 'short',
  day: 'numeric',
})

/** Risk banding matches the backend's thresholds: ≥50 high, ≥20 medium. */
function riskTone(score = 0): Tone {
  if (score >= 50) return 'danger'
  if (score >= 20) return 'warning'
  return 'success'
}

export default function SupportDashboard() {
  const { isLoaded } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState({
    openTickets: 0,
    highRisk: 0,
    activeDisputes: 0,
    overdue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Debounce the search box — the previous version issued a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    if (!isLoaded) return

    let cancelled = false
    const fetchTickets = async () => {
      setIsLoading(true)
      try {
        const params: Record<string, string> = {}
        if (statusFilter !== 'all') params.status = statusFilter
        if (categoryFilter !== 'all') params.category = categoryFilter
        if (searchTerm) params.query = searchTerm

        const [ticketsRes, statsRes] = await Promise.all([
          adminApi.getTickets(params),
          adminApi.getStats(),
        ])
        if (cancelled) return
        setTickets(ticketsRes.data || [])
        setStats(statsRes)
      } catch (error) {
        if (cancelled) return
        console.error(error)
        toast.error('حدث خطأ أثناء تحميل التذاكر')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchTickets()
    return () => {
      cancelled = true
    }
  }, [isLoaded, statusFilter, categoryFilter, searchTerm])

  const isOverdue = (dateString?: string) =>
    Boolean(dateString) && new Date(dateString as string) < new Date()

  const rows = useMemo(() => {
    if (activeTab === 'risk') return tickets.filter((t) => (t.riskScore ?? 0) >= 50)
    if (activeTab === 'disputes') return tickets.filter((t) => t.type === 'complaint')
    return tickets
  }, [tickets, activeTab])

  const filtersActive = statusFilter !== 'all' || categoryFilter !== 'all' || Boolean(searchTerm)

  const columns = useMemo<Column<Ticket>[]>(
    () => [
      {
        id: 'ticketNumber',
        header: 'المعرف',
        width: '110px',
        cell: (t) => <Code>{t.ticketNumber || t._id?.slice(-6) || '—'}</Code>,
      },
      {
        id: 'subject',
        header: 'الموضوع',
        width: 'minmax(220px, 1fr)',
        cell: (t) => (
          <CellTitle
            title={t.subject || '—'}
            subtitle={CATEGORY_LABEL[t.category || ''] ?? t.category}
          />
        ),
      },
      {
        id: 'type',
        header: 'النوع',
        width: '100px',
        cell: (t) => <span className="text-text-muted">{t.type || '—'}</span>,
      },
      {
        id: 'status',
        header: 'الحالة',
        width: '130px',
        cell: (t) => (
          <StatusBadge
            tone={STATUS_TONE[t.status || ''] ?? 'neutral'}
            label={STATUS_LABEL[t.status || ''] ?? t.status ?? '—'}
          />
        ),
      },
      {
        id: 'priority',
        header: 'الأولوية',
        width: '90px',
        cell: (t) => (
          <span
            className={cn(
              t.priority === 'high' ? 'font-medium text-tone-danger-fg' : 'text-text-muted',
            )}
          >
            {PRIORITY_LABEL[t.priority || ''] ?? t.priority ?? '—'}
          </span>
        ),
      },
      {
        id: 'riskScore',
        header: 'درجة الخطر',
        width: '110px',
        sortable: true,
        cell: (t) => (
          <span className="flex items-center gap-1.5">
            <StatusBadge
              variant="chip"
              tone={riskTone(t.riskScore)}
              label={String(t.riskScore ?? 0)}
            />
            {(t.riskScore ?? 0) >= 50 && (
              <ShieldAlert className="size-3.5 text-tone-danger-fg" aria-hidden />
            )}
          </span>
        ),
      },
      {
        id: 'sla',
        header: 'موعد الحل',
        width: '110px',
        cell: (t) => {
          const overdue = isOverdue(t.slaDeadline) && t.status !== 'resolved_refund'
          if (!t.slaDeadline) return <span className="text-text-faint">—</span>
          return (
            <span
              className={cn(
                'whitespace-nowrap',
                overdue ? 'font-medium text-tone-danger-fg' : 'text-text-muted',
              )}
            >
              {dateFmt.format(new Date(t.slaDeadline))}
              {overdue && ' — متأخرة'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        width: '70px',
        align: 'end',
        hideable: false,
        truncate: false,
        cell: (t) => (
          <Button variant="secondary" size="xs" asChild>
            <Link href={`/admin/support/${t._id || t.ticketNumber}`}>عرض</Link>
          </Button>
        ),
      },
    ],
    [],
  )

  const { visible, menu } = useColumnVisibility(columns, 'admin-support')

  return (
    <Page>
      <PageHeader
        title="الدعم والمخاطر"
        description="التذاكر والنزاعات ومؤشرات المخاطر على المنصة."
        tabs={
          <ViewTabs
            tabs={[
              { id: 'all', label: 'كل التذاكر', count: tickets.length },
              {
                id: 'risk',
                label: 'مخاطر عالية',
                count: tickets.filter((t) => (t.riskScore ?? 0) >= 50).length,
              },
              {
                id: 'disputes',
                label: 'النزاعات',
                count: tickets.filter((t) => t.type === 'complaint').length,
              },
            ]}
            value={activeTab}
            onValueChange={(id) => setActiveTab(id as TabKey)}
          />
        }
      />

      <PageBody variant="flush">
        <div className="px-6 py-5">
          <StatRow columns={4}>
            <Stat
              label="تذاكر مفتوحة"
              value={stats.openTickets}
              hint="تتطلب استجابة"
              loading={isLoading}
            />
            <Stat
              label="مخاطر عالية"
              value={stats.highRisk}
              hint="درجة خطر 50 فأكثر"
              loading={isLoading}
              emphasis
            />
            <Stat
              label="نزاعات نشطة"
              value={stats.activeDisputes}
              hint="شكاوى حول الطلبات"
              loading={isLoading}
            />
            <Stat
              label="تجاوز الـ SLA"
              value={stats.overdue}
              hint="تجاوزت وقت الحل المحدد"
              loading={isLoading}
            />
          </StatRow>
        </div>

        <Toolbar>
          <SearchInput
            value={searchInput}
            onValueChange={setSearchInput}
            placeholder="بحث عن تذكرة، رقم طلب أو مستخدم…"
            className="w-full max-w-xs"
          />
          <Filter
            label="الحالة"
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: 'all', label: 'جميع الحالات' },
              ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Filter
            label="الفئة"
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            options={[
              { value: 'all', label: 'جميع الفئات' },
              ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
            ]}
          />
          <ToolbarSpacer />
          <ToolbarDivider />
          {menu}
        </Toolbar>

        <DataTable
          data={rows}
          columns={columns}
          visibleColumns={visible}
          getRowId={(t) => t._id || t.ticketNumber || Math.random().toString(36)}
          loading={isLoading}
          rowAccent={(t) =>
            isOverdue(t.slaDeadline) && t.status !== 'resolved_refund'
              ? 'bg-tone-danger-fg'
              : undefined
          }
          empty={
            <EmptyState
              icon={<LifeBuoy className="size-4" />}
              title={filtersActive ? 'لا تذاكر مطابقة' : 'لا توجد تذاكر'}
              description={
                filtersActive
                  ? 'جرّب توسيع نطاق الفلاتر أو تغيير كلمة البحث.'
                  : 'كل شيء هادئ — لا توجد تذاكر دعم مفتوحة حالياً.'
              }
              action={
                filtersActive ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchInput('')
                      setStatusFilter('all')
                      setCategoryFilter('all')
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
      </PageBody>
    </Page>
  )
}
