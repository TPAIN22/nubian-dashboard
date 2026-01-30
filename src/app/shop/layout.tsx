"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconShoppingBag, IconUser, IconMenu2, IconDeviceMobile } from "@tabler/icons-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useCart } from "@/store/useCart";

// --- Mobile Alert Component ---
function MobileAppAlert() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simple check: Show on small screens if not dismissed session
    // For now, just show on mobile width
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        // Could check localStorage here to see if dismissed
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="bg-zinc-900 text-white px-4 py-3 relative flex items-center justify-between shadow-md z-50">
      <div className="flex items-center gap-3">
        <div className="bg-white/10 p-2 rounded-lg">
          <IconDeviceMobile className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">حمل تطبيق نوبيان</p>
          <p className="text-xs text-zinc-400">تجربة تسوق أفضل وأسرع</p>
        </div>
      </div>
      <a
        href="https://play.google.com/store/apps/details?id=dev.expo.nubian"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button size="sm" variant="secondary" className="text-xs h-8 rounded-full px-4">
          حمل الآن
        </Button>
      </a>
    </div>
  );
}

// --- Shop Navbar ---
function ShopNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const cartTotal = useCart(state => state.getTotalItems());

  const routes = [
    { href: "/shop", label: "الرئيسية" },
    { href: "/shop/categories", label: "التصنيفات" },
    { href: "/shop/stores", label: "المتاجر" },
    { href: "/shop/orders", label: "طلباتي" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-100/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="container max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6">

        {/* Right: Logo & Menu */}
        <div className="flex items-center gap-6">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-zinc-800 hover:bg-zinc-100 rounded-full">
                <IconMenu2 className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l-0 shadow-2xl">
              <div className="mt-8 flex flex-col gap-2">
                {routes.map(r => (
                  <Link key={r.href} href={r.href} onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-lg font-medium p-3 rounded-xl transition-all duration-200",
                      pathname === r.href
                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    )}>
                    {r.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/shop" className="group flex items-center gap-2">
            <Image src="/logo.png" alt="Nubian" width={30} height={30} />
            <span className="text-2xl font-bold tracking-tight text-zinc-900">
              نوبيان
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 mr-10 text-sm font-medium">
            {routes.map(route => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "relative py-1 transition-colors hover:text-zinc-900",
                  pathname === route.href ? "text-zinc-900 font-semibold" : "text-zinc-500"
                )}
              >
                {route.label}
                {pathname === route.href && (
                  <span className="absolute -bottom-1 right-0 w-full h-0.5 bg-zinc-900 rounded-full layout-id-active-nav" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Left: Cart & User */}
        <div className="flex items-center gap-3">
          <Link href="/shop/cart">
            <Button variant="ghost" size="icon" className="relative h-10 w-10 text-zinc-800 hover:bg-zinc-100 rounded-full transition-transform hover:scale-105">
              <IconShoppingBag className="w-5 h-5" />
              {cartTotal > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-amber-600 text-white ring-2 ring-white animate-in zoom-in spin-in-12 duration-300">
                  {cartTotal}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/shop/orders">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-800 hover:bg-zinc-100 rounded-full transition-transform hover:scale-105">
              <IconUser className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Alert Banner */}
      <MobileAppAlert />
    </header>
  );
}

import { ShopCategoryNav } from "@/components/shop/ShopCategoryNav";
import Image from "next/image";
import Footer from "@/components/Footer";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-sans text-zinc-900 bg-white flex flex-col">
      <ShopNavbar />
      <ShopCategoryNav />
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
