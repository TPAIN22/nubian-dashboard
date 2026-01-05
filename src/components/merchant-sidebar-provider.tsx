import { MerchantSidebar } from "@/components/merchant-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function MerchantSidebarProvider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <MerchantSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

