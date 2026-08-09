'use client'

import * as React from 'react'
import { UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'

import {
  Alert,
  Button,
  CellEmpty,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  FieldGrid,
  FormSection,
  Input,
  Page,
  PageBody,
  PageHeader,
  Select,
  StatusBadge,
  type Column,
} from '@/components/admin'
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  useInviteMember,
  useRemoveMember,
  useStoreTeam,
  useTransferOwnership,
  useUpdateMemberRole,
  type StoreMember,
  type StoreRole,
} from '@/features/merchant/api'

/* ============================================================================
   Store team
   ----------------------------------------------------------------------------
   A store used to be one person by definition — its owner's Clerk id WAS the
   store row. This screen is the front end of the membership model that replaced
   that: several people can run one shop, with what each may do decided by role.

   Everything here is advisory. The backend gates each route on a permission and
   re-checks membership on every request, so hiding a control is a courtesy to
   the user, never the thing that stops them.
   ========================================================================== */

const ASSIGNABLE: StoreRole[] = ['manager', 'staff']

function statusBadge(member: StoreMember) {
  if (member.status === 'active') return <StatusBadge tone="success" label="نشط" />
  if (member.status === 'invited') return <StatusBadge tone="warning" label="دعوة معلّقة" />
  return <StatusBadge tone="neutral" label="ملغى" />
}

export default function MerchantTeamPage() {
  const team = useStoreTeam()
  const invite = useInviteMember()
  const updateRole = useUpdateMemberRole()
  const remove = useRemoveMember()
  const transfer = useTransferOwnership()

  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<StoreRole>('staff')
  const [confirmRemove, setConfirmRemove] = React.useState<StoreMember | null>(null)
  const [confirmTransfer, setConfirmTransfer] = React.useState<StoreMember | null>(null)

  // The caller's own role arrives in `meta`, not by matching the signed-in user
  // against the member list — the browser has no Clerk id to match on.
  const canManage = team.data?.permissions?.includes('team:write') ?? false
  const isOwner = team.data?.role === 'owner'

  // Revoked rows are kept by the backend as an audit trail; they are not part of
  // the team and would only pad this table.
  const visibleMembers = React.useMemo(
    () => (team.data?.members ?? []).filter((m) => m.status !== 'revoked'),
    [team.data?.members],
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
        cell: (m) => {
          // The owner's role is not editable in place: a store has exactly one
          // owner, so changing it is a transfer, not an edit.
          if (m.role === 'owner' || !canManage) {
            return <span className="text-foreground">{ROLE_LABELS[m.role]}</span>
          }
          return (
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
          )
        },
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
        width: '210px',
        truncate: false,
        hideable: false,
        align: 'end',
        cell: (m) => {
          if (!canManage || m.role === 'owner') return null
          return (
            <div className="flex justify-end gap-1.5">
              {isOwner && m.status === 'active' && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmTransfer(m)}>
                  نقل الملكية
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(m)}>
                إزالة
              </Button>
            </div>
          )
        },
      },
    ],
    [canManage, isOwner, updateRole],
  )

  if (team.isError) {
    return (
      <Page>
        <PageHeader title="فريق المتجر" />
        <PageBody>
          <ErrorState
            size="page"
            description={(team.error as Error)?.message}
            onRetry={() => team.refetch()}
          />
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title="فريق المتجر"
        description="من يستطيع الدخول إلى متجرك، وما الذي يستطيع فعله."
      />

      <PageBody variant="narrow">
        {!canManage && !team.isLoading && (
          <Alert tone="neutral">
            يمكنك الاطلاع على أعضاء الفريق فقط. إدارة الفريق متاحة لمالك المتجر.
          </Alert>
        )}

        {canManage && (
          <FormSection
            title="دعوة عضو جديد"
            description="سنرسل رابط انضمام إلى هذا البريد. لا يحتاج الشخص إلى حساب على نُوبيان مسبقاً."
          >
            <form onSubmit={submitInvite} noValidate>
              <FieldGrid>
                <Field label="البريد الإلكتروني" required>
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
          </FormSection>
        )}

        <FormSection title="الأعضاء" description="مالك واحد لكل متجر. الأدوار تراكمية.">
          <DataTable
            data={visibleMembers}
            columns={columns}
            getRowId={(m) => m.id}
            loading={team.isLoading}
            skeletonRows={3}
            empty={
              <EmptyState
                icon={<Users className="size-4" />}
                title="لا يوجد أعضاء بعد"
                description="ادعُ زميلاً ليساعدك في إدارة الطلبات والمنتجات."
              />
            }
          />
        </FormSection>
      </PageBody>

      <ConfirmDialog
        open={Boolean(confirmRemove)}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
        title="إزالة العضو؟"
        description={`سيفقد ${confirmRemove?.email ?? ''} صلاحية الدخول إلى المتجر فوراً. يمكنك دعوته مرة أخرى لاحقاً.`}
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

      <ConfirmDialog
        open={Boolean(confirmTransfer)}
        onOpenChange={(open) => !open && setConfirmTransfer(null)}
        title="نقل ملكية المتجر؟"
        description={`سيصبح ${confirmTransfer?.email ?? ''} مالك المتجر، وستتحول أنت إلى مدير. لن تتمكن من التراجع عن هذا بنفسك.`}
        variant="destructive"
        confirmText="نقل الملكية"
        loading={transfer.isPending}
        onConfirm={() => {
          if (!confirmTransfer) return
          transfer.mutate(confirmTransfer.id, {
            onSuccess: () => {
              toast.success('تم نقل ملكية المتجر')
              setConfirmTransfer(null)
            },
            onError: (err: Error) => toast.error(err.message || 'تعذر نقل الملكية'),
          })
        }}
      />
    </Page>
  )
}
