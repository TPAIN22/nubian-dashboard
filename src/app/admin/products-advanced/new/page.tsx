import React from 'react'
import ProductWizard from '../v2/ProductWizard';

export default function Page() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 px-4">إضافة منتج جديد</h1>
      <ProductWizard />
    </div>
  )
}
