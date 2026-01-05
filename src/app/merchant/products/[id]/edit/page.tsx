'use client'

import { MerchantProductForm } from '../../new/productForm'

export default function EditProductPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2">
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <MerchantProductForm productId={params.id} />
    </div>
  )
}

