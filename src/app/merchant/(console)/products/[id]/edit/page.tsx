import { use } from 'react'
import ProductWizard from '@/app/admin/products-advanced/v2/ProductWizard'

/** The wizard renders its own page chrome — see ../../new/page.tsx. */
export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <ProductWizard
      productId={id}
      redirectPath="/merchant/products"
      addCategoryPath={`/merchant/categories/new?from=/merchant/products/${id}/edit`}
    />
  )
}
