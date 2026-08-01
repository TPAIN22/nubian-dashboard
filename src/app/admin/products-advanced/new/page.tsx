import ProductWizard from '../v2/ProductWizard'

/**
 * The wizard owns its full page chrome (header, step rail, sticky action bar),
 * so this route is just a mount point — no wrapper padding, no second title.
 */
export default function Page() {
  return <ProductWizard />
}
