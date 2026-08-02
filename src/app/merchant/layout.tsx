/**
 * The `merchant-theme` class is the boundary for the console design system
 * (src/styles/admin.css) — the same token set `/admin` runs on, so the two
 * panels are visually one product.
 *
 * Chrome is deliberately NOT applied here. `/merchant` serves two different
 * audiences: approved merchants who need the full console rail (see
 * `(console)/layout.tsx`), and applicants who have no merchant routes to
 * navigate to yet (see `(onboarding)/layout.tsx`). Putting the rail at this
 * level is what used to show an applicant a nav full of links the middleware
 * immediately bounced them off.
 */
export default function MerchantLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="merchant-theme">{children}</div>
}
