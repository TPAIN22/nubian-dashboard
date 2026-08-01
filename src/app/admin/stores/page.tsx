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

  // Unclaimed stores are the ones needing attention, and any store with a
  // pending claim request jumps to the very top.
  const unclaimed = stores
    .filter((s) => s.claimStatus === 'unclaimed')
    .sort((a, b) => Number(Boolean(b.claimRequestedBy)) - Number(Boolean(a.claimRequestedBy)))

  const awaitingConfirmation = unclaimed.filter((s) => s.claimRequestedBy).length

  return (
    <Page>
      <PageHeader
        title="متاجر الإدارة"
        description="أنشئ متجراً نيابة عن التاجر، أضف منتجاته، ثم اربطه بحسابه عندما يسجّل."
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

          <StoresTable stores={unclaimed} />
        </Stack>
      </PageBody>
    </Page>
  )
}
