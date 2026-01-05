import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { MerchantSidebarProvider } from '@/components/merchant-sidebar-provider'

export const metadata: Metadata = {
  title: 'Merchant Dashboard - Nubian',
  description: 'Merchant dashboard for managing your store',
}

export default function MerchantLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <MerchantSidebarProvider>
      {children}
      <Toaster/>
    </MerchantSidebarProvider>
  )
}

