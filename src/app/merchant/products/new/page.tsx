'use client'

import MerchantProductForm from './productForm'

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
      <h1 className="text-2xl font-bold">إنشاء منتج جديد</h1>
      <MerchantProductForm/>
    </div>
  )
}

