"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// import { Icons } from "@/components/icons" 
import { Button } from "@/components/ui/button"
import { IconMenu2, IconX } from "@tabler/icons-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MarketingNavbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  const routes = [
    {
      href: "/",
      label: "الرئيسية",
      active: pathname === "/",
    },
    {
      href: "/shop",
      label: "المتجر",
      active: pathname === "/shop",
    },
    {
      href: "/pricing",
      label: "الباقات",
      active: pathname === "/pricing",
    },
    {
      href: "/about",
      label: "من نحن",
      active: pathname === "/about",
    },
    {
      href: "/contact",
      label: "اتصل بنا",
      active: pathname === "/contact",
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container max-w-7xl mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-2xl font-bold tracking-tighter sm:inline-block">
              نوبيان
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "transition-colors hover:text-zinc-900",
                  route.active ? "text-zinc-900" : "text-zinc-500"
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="rounded-full">تسجيل الدخول</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="rounded-full px-6">ابدأ الآن</Button>
            </Link>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <IconMenu2 className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <div className="px-7">
                <Link
                  href="/"
                  className="flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="font-bold text-xl">نوبيان</span>
                </Link>
              </div>
              <div className="mt-8 flex flex-col gap-4 px-2">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-lg font-medium transition-colors hover:bg-muted rounded-md",
                      route.active ? "bg-muted text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {route.label}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-2 px-4">
                  <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full justify-start">تسجيل الدخول</Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                    <Button className="w-full rounded-full justify-start">ابدأ الآن</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
