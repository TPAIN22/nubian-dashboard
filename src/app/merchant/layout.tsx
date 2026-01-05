import type { Metadata } from 'next'
import { MerchantSidebarWrapper } from '@/components/merchant-sidebar-wrapper'

export const metadata: Metadata = {
  title: 'لوحة تحكم التاجر - نوبيان',
  description: 'لوحة تحكم التاجر لإدارة متجرك',
}

export default function MerchantLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <MerchantSidebarWrapper>
      {children}
    </MerchantSidebarWrapper>
  )
}

