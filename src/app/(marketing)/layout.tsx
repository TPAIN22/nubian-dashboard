import { MinimalNavbar } from "@/components/marketing/MinimalNavbar"
import { MinimalFooter } from "@/components/marketing/MinimalFooter"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col font-ibm-plex-arabic antialiased bg-background text-foreground selection:bg-foreground selection:text-background" dir="rtl">
      <MinimalNavbar />
      <main className="flex-1">
        {children}
      </main>
      <MinimalFooter />
    </div>
  )
}
