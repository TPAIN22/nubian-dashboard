import { axiosInstance } from '@/lib/axiosInstance'
import { auth } from '@clerk/nextjs/server'
import { Alert, Page, PageBody, PageHeader, Stack } from '@/components/admin'
import { StoresTable, type Store } from './StoresTable'
import { StoreFormDialog } from './StoreFormDialog'

export const dynamic = 'force-dynamic'

export default async function StoresPage() {
  const { getToken } = await auth()
  const token = await getToken()

  const stores: Store[] = await axiosInstance
    .get('/merchants', { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.data?.data || res.data || [])
    .catch(() => [])

  // Claimed stores are listed too — an admin has to be able to fix a logo or a
  // typo on a live merchant.
  //
  // Applicants still in the review pipeline are NOT stores yet and belong to
  // /admin/applications; including them here would duplicate that page and bury
  // the real stores. Admin-created stores are approved on creation, so this
  // never hides one of those.
  const PIPELINE = ['pending', 'rejected', 'needs_revision']
  const visible = stores.filter((s) => !PIPELINE.includes(s.status))

  // What needs attention first: pending claim requests, then unclaimed stores,
  // then everything already owned.
  const rank = (s: Store) => {
    if (s.claimStatus === 'unclaimed' && s.claimRequestedBy) return 0
    if (s.claimStatus === 'unclaimed') return 1
    return 2
  }
  const sorted = [...visible].sort((a, b) => rank(a) - rank(b))

  const awaitingConfirmation = stores.filter(
    (s) => s.claimStatus === 'unclaimed' && s.claimRequestedBy
  ).length

  return (
    <Page>
      <PageHeader
        title="متاجر الإدارة"
        description="أنشئ متجراً نيابة عن التاجر، أضف منتجاته، ثم اربطه بحسابه عندما يسجّل. تظهر هنا أيضاً المتاجر المرتبطة بحسابات تجّار لتعديل بياناتها."
        actions={<StoreFormDialog />}
      />

      <PageBody>
        <Stack gap="md">
          {awaitingConfirmation > 0 && (
            <Alert tone="warning" title="متاجر بانتظار تأكيد الربط">
              {awaitingConfirmation} متجر طلب مالكه المسجَّل ربطه بحسابه. راجع الطلبات أدناه —
              تظهر في أعلى القائمة.
            </Alert>
          )}

          <StoresTable stores={sorted} />
        </Stack>
      </PageBody>
    </Page>
  )
}
