import { use } from 'react'
import ProductWizard from '../../v2/ProductWizard'

/** The wizard renders its own page chrome — see ../../new/page.tsx. */
export default function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = use(params)
  return <ProductWizard productId={productId} />
}
