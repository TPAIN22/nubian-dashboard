import ProductWizard from '@/app/admin/products-advanced/v2/ProductWizard'

/**
 * The wizard renders its own header, step rail and sticky action bar, so this
 * route mounts it directly — a wrapper `container` + `<h1>` would duplicate the
 * title and break the sticky footer's height context.
 */
export default function Page() {
  return (
    <ProductWizard
      redirectPath="/merchant/products"
      addCategoryPath="/merchant/categories/new?from=/merchant/products/new"
    />
  )
}
