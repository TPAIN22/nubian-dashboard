import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SignedIn, UserButton  } from "@clerk/nextjs"
import  ModeToggle  from "../components/mode-toggle"


export function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-base font-medium">Nubian Sd</h1>
        <div className="ml-auto flex items-center gap-2">
          <SignedIn>
              <UserButton />
          </SignedIn>
        <ModeToggle />
      </div>
    </header>
  )
}
