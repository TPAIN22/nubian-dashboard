import { MarketingNavbar } from "@/components/marketing/MarketingNavbar"
import { MarketingFooter } from "@/components/marketing/MarketingFooter"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="light flex min-h-screen flex-col font-sans antialiased text-zinc-950 bg-white selection:bg-zinc-900 selection:text-white" data-theme="light">
      <MarketingNavbar />
      <main className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  )
}
