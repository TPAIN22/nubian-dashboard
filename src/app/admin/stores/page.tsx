import { axiosInstance } from '@/lib/axiosInstance';
import { auth } from '@clerk/nextjs/server';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StoresTable, type Store } from './StoresTable';
import { StoreFormDialog } from './StoreFormDialog';

export const dynamic = 'force-dynamic';

export default async function StoresPage() {
  const { getToken } = await auth();
  const token = await getToken();

  const stores: Store[] = await axiosInstance
    .get('/merchants', { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.data?.data || res.data || [])
    .catch(() => []);

  // Unclaimed stores are the ones needing attention, and any store with a
  // pending claim request jumps to the very top.
  const unclaimed = stores
    .filter((s) => s.claimStatus === 'unclaimed')
    .sort((a, b) => Number(Boolean(b.claimRequestedBy)) - Number(Boolean(a.claimRequestedBy)));

  const awaitingConfirmation = unclaimed.filter((s) => s.claimRequestedBy).length;

  return (
    <div className="container max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="المتاجر المُنشأة بواسطة الإدارة"
        description="أنشئ متجراً نيابة عن التاجر، أضف منتجاته، ثم اربطه بحسابه عندما يسجّل."
      >
        <StoreFormDialog />
      </PageHeader>

      {awaitingConfirmation > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          {awaitingConfirmation} متجر بانتظار تأكيد الربط بمالكه المسجَّل.
        </div>
      )}

      <StoresTable stores={unclaimed} />
    </div>
  );
}
