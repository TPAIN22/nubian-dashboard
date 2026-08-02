import { MerchantShell } from '@/components/merchant/shell/merchant-shell'

/**
 * Merchant business tools. Everything under this group is gated by the
 * middleware to `role === "merchant" && merchantStatus === "approved"`, so it
 * can assume a live store exists and render the full console rail.
 */
export default function MerchantConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <MerchantShell>{children}</MerchantShell>
}
