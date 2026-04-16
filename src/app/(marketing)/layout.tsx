import { MinimalNavbar } from "@/components/marketing/MinimalNavbar"
import { MinimalFooter } from "@/components/marketing/MinimalFooter"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="light flex min-h-screen flex-col font-ibm-plex-arabic antialiased text-zinc-950 bg-white selection:bg-zinc-900 selection:text-white" data-theme="light" dir="rtl">
      <MinimalNavbar />
      <main className="flex-1">
        {children}
      </main>
      <MinimalFooter />
    </div>
  )
}
