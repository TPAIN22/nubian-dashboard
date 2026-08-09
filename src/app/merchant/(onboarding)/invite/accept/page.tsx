'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Store } from 'lucide-react'
import { toast } from 'sonner'

import {
  Alert,
  Button,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Section,
  StatusBadge,
} from '@/components/admin'
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  useAcceptInvite,
  useMyMemberships,
  type StoreMembership,
} from '@/features/merchant/api'

/* ============================================================================
   Accept a store invitation
   ----------------------------------------------------------------------------
   Lives in the onboarding group, not the console: the visitor is not a merchant
   yet, has no store to navigate, and the console rail would be a wall of links
   they cannot open. `/merchant/invite` is exempted in middleware.ts for the same
   reason — gating it on an approved merchantStatus would bounce every invitee
   to the application form and make the invitation impossible to accept.

   The `?store=` param from the email only preselects. The invitation itself is
   matched server-side against the email addresses Clerk holds for the account,
   so a link forwarded to somebody else grants them nothing.
   ========================================================================== */

/**
 * `useSearchParams` opts the subtree out of prerendering, and Next refuses to
 * build a page that does so without a boundary. The Suspense wrapper is what
 * lets the rest of the route stay static.
 */
export default function AcceptInvitePage() {
  return (
    <React.Suspense
      fallback={
        <Section title="دعوة للانضمام">
          <ListSkeleton rows={2} />
        </Section>
      }
    >
      <AcceptInvite />
    </React.Suspense>
  )
}

function AcceptInvite() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedStore = searchParams.get('store')

  const memberships = useMyMemberships()
  const accept = useAcceptInvite()

  const invitations = React.useMemo(
    () => (memberships.data ?? []).filter((m) => m.status === 'invited'),
    [memberships.data],
  )
  const alreadyMember = React.useMemo(
    () => (memberships.data ?? []).filter((m) => m.status === 'active'),
    [memberships.data],
  )

  const onAccept = (invitation: StoreMembership) => {
    accept.mutate(invitation.merchantId, {
      onSuccess: () => {
        toast.success(`انضممت إلى ${invitation.storeName}`)
        // Clerk metadata was just granted server-side; the session claims are
        // still stale, but middleware refetches when the role is missing, so
        // the console is reachable immediately.
        router.push('/merchant/dashboard')
      },
      onError: (err: Error) => toast.error(err.message || 'تعذر قبول الدعوة'),
    })
  }

  if (memberships.isError) {
    return (
      <Section title="دعوة للانضمام">
        <ErrorState
          size="page"
          description={(memberships.error as Error)?.message}
          onRetry={() => memberships.refetch()}
        />
      </Section>
    )
  }

  if (memberships.isLoading) {
    return (
      <Section title="دعوة للانضمام">
        <ListSkeleton rows={2} />
      </Section>
    )
  }

  if (invitations.length === 0) {
    return (
      <Section title="دعوة للانضمام">
        <EmptyState
          icon={<Store className="size-4" />}
          title="لا توجد دعوات معلّقة"
          description={
            alreadyMember.length > 0
              ? 'ربما قبلت هذه الدعوة بالفعل. يمكنك الانتقال إلى لوحة المتجر.'
              : 'تأكد من تسجيل الدخول بنفس البريد الإلكتروني الذي وصلتك عليه الدعوة.'
          }
        />
        {alreadyMember.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Button variant="primary" size="sm" onClick={() => router.push('/merchant/dashboard')}>
              الذهاب إلى لوحة المتجر
            </Button>
          </div>
        )}
      </Section>
    )
  }

  return (
    <Section
      title="دعوة للانضمام"
      description="تمت دعوتك للعمل ضمن فريق المتجر التالي."
    >
      {requestedStore && !invitations.some((i) => i.merchantId === requestedStore) && (
        <Alert tone="warning">
          الدعوة التي فتحتها ليست ضمن دعواتك المعلّقة. قد تكون موجهة إلى بريد إلكتروني آخر.
        </Alert>
      )}

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.membershipId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-canvas p-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{invitation.storeName}</span>
                <StatusBadge tone="neutral" label={ROLE_LABELS[invitation.role]} />
              </div>
              <p className="mt-1 text-[12px] text-text-muted">
                {ROLE_DESCRIPTIONS[invitation.role]}
              </p>
              {invitation.city && (
                <p className="mt-0.5 text-[12px] text-text-faint">{invitation.city}</p>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              loading={accept.isPending}
              onClick={() => onAccept(invitation)}
            >
              قبول الدعوة
            </Button>
          </div>
        ))}
      </div>
    </Section>
  )
}
