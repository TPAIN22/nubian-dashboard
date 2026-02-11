import { use } from 'react'
import ProductWizard from '@/app/business/products/v2/ProductWizard';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 px-4">تعديل المنتج</h1>
      <ProductWizard productId={id} redirectPath="/merchant/products" />
    </div>
  )
}
