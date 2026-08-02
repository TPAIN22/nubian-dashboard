/**
 * Merchant onboarding — apply and application status.
 *
 * No nav rail: the visitor has no merchant routes to navigate to yet. A single
 * centred column on the console canvas, so the moment they are approved and
 * land in `(console)` the typography and surfaces are already familiar.
 */
export default function MerchantOnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">{children}</div>
    </div>
  )
}
