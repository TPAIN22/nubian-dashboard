import { use } from 'react'
import ProductWizard from '../../v2/ProductWizard';

export default function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 px-4">تعديل المنتج</h1>
      <ProductWizard productId={productId} />
    </div>
  )
}