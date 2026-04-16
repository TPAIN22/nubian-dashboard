import Side from '@/components/ui/side-bar-provider'

export default function MerchantLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="merchant-theme min-h-screen bg-background text-foreground font-sans overflow-hidden">
      <Side>
        <div className="h-full flex flex-col overflow-auto">
          {children}
        </div>
      </Side>
    </div>
  )
}
