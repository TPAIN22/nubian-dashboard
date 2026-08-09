'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'

import {
  Button,
  CellEmpty,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  FieldGrid,
  Input,
  Section,
  Select,
  StatusBadge,
  type Column,
} from '@/components/admin'
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  merchantRequest,
  type StoreMember,
  type StoreRole,
} from '@/features/merchant/api'

/* ============================================================================
   Store team, admin side
   ----------------------------------------------------------------------------
   The same data the merchant sees on /merchant/settings/team, for a store the
   admin does not belong to. It answers the support question this panel exists
   for — "why can this person not get into their shop?" — and lets an admin fix
   it without asking the owner to do it.

   Every call here is audited on the backend, reads included.

   The owner's row is read-only: removing or demoting an owner would leave a
   store nobody can run. Ownership moves only through the merchant's own
   transfer flow.
   ========================================================================== */

const ASSIGNABLE: StoreRole[] = ['manager', 'staff']

const teamKey = (storeId: string) => ['admin', 'store-team', storeId] as const

function statusBadge(member: StoreMember) {
  if (member.status === 'active') return <StatusBadge tone="success" label="نشط" />
  if (member.status === 'invited') return <StatusBadge tone="warning" label="دعوة معلّقة" />
  return <StatusBadge tone="neutral" label="ملغى" />
}

export function StoreTeamPanel({ storeId, storeName }: { storeId: string; storeName: string }) {
  const qc = useQueryClient()
  const base = `/api/admin/stores/${encodeURIComponent(storeId)}/team`
  const invalidate = () => qc.invalidateQueries({ queryKey: teamKey(storeId) })

  const team = useQuery({
    queryKey: teamKey(storeId),
    queryFn: async () => {
      const body = await merchantRequest<any>(base)
      return (Array.isArray(body?.data) ? body.data : []) as StoreMember[]
    },
    staleTime: 30_000,
  })

  const invite = useMutation({
    mutationFn: (values: { email: string; role: StoreRole }) =>
      merchantRequest(base, { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: invalidate,
  })

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: StoreRole }) =>
      merchantRequest(`${base}/${encodeURIComponent(memberId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (memberId: string) =>
      merchantRequest(`${base}/${encodeURIComponent(memberId)}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })

  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<StoreRole>('staff')
  const [confirmRemove, setConfirmRemove] = React.useState<StoreMember | null>(null)

  // Revoked rows are the backend's audit trail, not part of the team.
  const members = React.useMemo(
    () => (team.data ?? []).filter((m) => m.status !== 'revoked'),
    [team.data],
  )

  const submitInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    invite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          toast.success(`تم إرسال الدعوة إلى ${email.trim()}`)
          setEmail('')
          setRole('staff')
        },
        onError: (err: Error) => toast.error(err.message || 'تعذر إرسال الدعوة'),
      },
    )
  }

  const columns: Column<StoreMember>[] = React.useMemo(
    () => [
      {
        id: 'email',
        header: 'البريد الإلكتروني',
        hideable: false,
        cell: (m) => (
          <span dir="ltr" className="font-medium text-foreground">
            {m.email}
          </span>
        ),
      },
      {
        id: 'role',
        header: 'الصلاحية',
        width: '170px',
        truncate: false,
        cell: (m) =>
          m.role === 'owner' ? (
            <span className="text-foreground">{ROLE_LABELS.owner}</span>
          ) : (
            <Select
              value={m.role}
              disabled={updateRole.isPending}
              onChange={(e) => {
                const next = e.target.value as StoreRole
                if (next === m.role) return
                updateRole.mutate(
                  { memberId: m.id, role: next },
                  {
                    onSuccess: () => toast.success('تم تحديث الصلاحية'),
                    onError: (err: Error) => toast.error(err.message || 'تعذر تحديث الصلاحية'),
                  },
                )
              }}
            >
              {ASSIGNABLE.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          ),
      },
      {
        id: 'status',
        header: 'الحالة',
        width: '130px',
        truncate: false,
        hideable: false,
        cell: statusBadge,
      },
      {
        id: 'joined',
        header: 'تاريخ الانضمام',
        width: '130px',
        cell: (m) =>
          m.acceptedAt ? (
            <span className="text-text-muted nums">
              {new Date(m.acceptedAt).toLocaleDateString('en-CA')}
            </span>
          ) : (
            <CellEmpty />
          ),
      },
      {
        id: 'actions',
        header: '',
        width: '110px',
        align: 'end',
        truncate: false,
        hideable: false,
        cell: (m) =>
          m.role === 'owner' ? null : (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(m)}>
                إزالة
              </Button>
            </div>
          ),
      },
    ],
    [updateRole],
  )

  if (team.isError) {
    return (
      <Section title="فريق المتجر">
        <ErrorState description={(team.error as Error)?.message} onRetry={() => team.refetch()} />
      </Section>
    )
  }

  return (
    <Section
      title="فريق المتجر"
      description="من يستطيع الدخول إلى هذا المتجر. كل تعديل هنا يُسجَّل باسمك."
    >
      <form onSubmit={submitInvite} noValidate className="mb-4">
        <FieldGrid>
          <Field label="دعوة عضو جديد" hint="سيصله رابط انضمام على هذا البريد.">
            <Input
              type="email"
              dir="ltr"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="الصلاحية" hint={ROLE_DESCRIPTIONS[role]}>
            <Select value={role} onChange={(e) => setRole(e.target.value as StoreRole)}>
              {ASSIGNABLE.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>
        <div className="mt-3 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={invite.isPending}
            disabled={!email.trim()}
          >
            <UserPlus className="size-3.5" />
            إرسال الدعوة
          </Button>
        </div>
      </form>

      <DataTable
        data={members}
        columns={columns}
        getRowId={(m) => m.id}
        loading={team.isLoading}
        skeletonRows={2}
        empty={
          <EmptyState
            icon={<Users className="size-4" />}
            title="لا يوجد أعضاء"
            description={`لم يُربط ${storeName} بأي حساب بعد.`}
          />
        }
      />

      <ConfirmDialog
        open={Boolean(confirmRemove)}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
        title="إزالة العضو؟"
        description={`سيفقد ${confirmRemove?.email ?? ''} صلاحية الدخول إلى ${storeName} فوراً. سيُسجَّل هذا الإجراء باسمك.`}
        variant="destructive"
        confirmText="إزالة"
        loading={remove.isPending}
        onConfirm={() => {
          if (!confirmRemove) return
          remove.mutate(confirmRemove.id, {
            onSuccess: () => {
              toast.success('تمت إزالة العضو')
              setConfirmRemove(null)
            },
            onError: (err: Error) => toast.error(err.message || 'تعذرت إزالة العضو'),
          })
        }}
      />
    </Section>
  )
}
