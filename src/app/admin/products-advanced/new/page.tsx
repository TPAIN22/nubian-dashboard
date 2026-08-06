import ProductWizard from '../v2/ProductWizard'

/**
 * The wizard owns its full page chrome (header, step rail, sticky action bar),
 * so this route is just a mount point — no wrapper padding, no second title.
 *
 * `?merchant=<id>` pre-selects the store, so "إضافة منتج" from a store page
 * lands on a wizard already pointed at that shop. Read here rather than via
 * useSearchParams inside the wizard: this is a server component, so the value
 * arrives without forcing a Suspense boundary on every other mount point.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ merchant?: string }>
}) {
  const { merchant } = await searchParams
  return <ProductWizard defaultMerchantId={merchant} />
}
