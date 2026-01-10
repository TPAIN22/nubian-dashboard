'use client'

import { use } from 'react'
import ProductForm from '../../new/productForm'

export default function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
      <h1 className="text-2xl font-bold">تعديل المنتج</h1>
      <ProductForm productId={productId} />
    </div>
  )
}