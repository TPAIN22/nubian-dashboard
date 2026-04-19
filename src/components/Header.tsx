"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Users, MessageCircle, HelpCircle, LayoutDashboard, UserCircle, Briefcase } from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";

type NavLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

const GUEST_LINKS: NavLink[] = [
  { href: "#shoppers", label: "للمشترين", ariaLabel: "للمشترين - For Shoppers" },
  { href: "#merchants", label: "للتجار", ariaLabel: "للتجار - For Merchants" },
  { href: "#faq", label: "الأسئلة الشائعة", ariaLabel: "الأسئلة الشائعة - FAQ" },
  { href: "/affiliate/register", label: "برنامج المسوقين", ariaLabel: "برنامج المسوقين - Affiliate Program" },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin", label: "الرئيسية", ariaLabel: "Admin Dashboard" },
  { href: "/admin/marketers", label: "المسوقون", ariaLabel: "Manage Marketers" },
  { href: "/admin/commissions", label: "العمولات", ariaLabel: "Manage Commissions" },
  { href: "/admin/applications", label: "الطلبات", ariaLabel: "Review Applications" },
];

const MERCHANT_LINKS: NavLink[] = [
  { href: "/merchant/dashboard", label: "الرئيسية", ariaLabel: "Merchant Dashboard" },
  { href: "/merchant/products", label: "منتجاتي", ariaLabel: "Merchant Products" },
  { href: "/merchant/orders", label: "الطلبات", ariaLabel: "Merchant Orders" },
  { href: "/merchant/analytics", label: "التحليلات", ariaLabel: "Merchant Analytics" },
];

const MARKETER_LINKS: NavLink[] = [
  { href: "/affiliate", label: "الرئيسية", ariaLabel: "Marketer Overview" },
  { href: "/affiliate", label: "إحصائياتي", ariaLabel: "Marketer Stats" },
  { href: "/affiliate/register", label: "الدليل", ariaLabel: "Affiliate Guide" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();

  const userRole = user?.publicMetadata?.role as string;

  const getDashboardData = () => {
    switch (userRole) {
      case 'admin':
      case 'support':
        return { label: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard };
      case 'merchant':
        return { label: 'لوحة التاجر', href: '/merchant/dashboard', icon: LayoutDashboard };
      case 'marketer':
      case 'affiliate':
        return { label: 'لوحة المسوق', href: '/affiliate', icon: LayoutDashboard };
      default:
        return null;
    }
  };

  const dashboardData = getDashboardData();

  const getRoleLinks = () => {
    if (!isSignedIn) return GUEST_LINKS;
    switch (userRole) {
      case 'admin':
      case 'support':
        return ADMIN_LINKS;
      case 'merchant':
        return MERCHANT_LINKS;
      case 'marketer':
      case 'affiliate':
        return MARKETER_LINKS;
      default:
        return GUEST_LINKS;
    }
  };

  const navLinks = getRoleLinks();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToHash = (href: string) => {
    if (!href.startsWith("#")) return;
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <header
        dir="rtl"
        className="fixed top-0 left-0 right-0 z-50 w-full"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div
            className={[
              "mt-3 rounded-2xl border backdrop-blur-xl transition-all duration-300",
              isScrolled
                ? "bg-background/90 shadow-lg border-border/60"
                : "bg-background/75 shadow-md border-border/40",
            ].join(" ")}
          >
            <div
              className={[
                "flex items-center gap-3 px-3 sm:px-4",
                isScrolled ? "h-14 sm:h-16" : "h-16 sm:h-20",
              ].join(" ")}
            >
              {/* Right: Logo */}
              <Link
                href="/"
                className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
                aria-label="نوبيان - Nubian الصفحة الرئيسية"
              >
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="نوبيان - Nubian Logo"
                    width={isScrolled ? 36 : 42}
                    height={isScrolled ? 36 : 42}
                    priority
                    className="transition-transform duration-300 hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>

                <span className="hidden sm:block text-xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  نوبيان
                </span>
              </Link>

              {/* Center: Desktop nav */}
              <nav
                className="hidden md:flex flex-1 items-center justify-center gap-1"
                aria-label="Primary Navigation"
              >
                {navLinks.map((link) => {
                  const isExternal = link.href.startsWith('/') && !link.href.startsWith('#');
                  return isExternal ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="relative px-4 lg:px-6 py-2 text-sm lg:text-base font-bold text-foreground/80 hover:text-primary transition-all duration-300 rounded-lg hover:bg-primary/10"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => scrollToHash(link.href)}
                      className="relative px-4 lg:px-6 py-2 text-sm lg:text-base font-bold text-foreground/80 hover:text-primary transition-all duration-300 rounded-lg hover:bg-primary/10"
                      aria-label={link.ariaLabel}
                    >
                      {link.label}
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-10" />
                    </button>
                  );
                })}
              </nav>

              {/* Left: Desktop CTAs */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                {!isLoaded ? (
                  <div className="flex gap-2">
                    <div className="w-24 h-10 bg-muted animate-pulse rounded-lg" />
                    <div className="w-24 h-10 bg-muted animate-pulse rounded-lg" />
                  </div>
                ) : isSignedIn ? (
                  <div className="flex items-center gap-4">
                    {dashboardData && (
                      <Link href={dashboardData.href}>
                        <Button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold px-4 flex items-center gap-2">
                          <dashboardData.icon className="w-4 h-4" />
                          {dashboardData.label}
                        </Button>
                      </Link>
                    )}
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "h-10 w-10 border-2 border-primary/20 hover:border-primary/50 transition-all"
                        }
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <Link href="/affiliate/register">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 font-bold px-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        كن مسوقاً
                      </Button>
                    </Link>
                    <Link href="/merchant/apply">
                      <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold px-5">
                        سجّل كتاجر
                      </Button>
                    </Link>
                    <Link href="/sign-in">
                      <Button
                        variant="outline"
                        className="border-2 border-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 font-bold px-5"
                      >
                        تسجيل الدخول
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile: Menu */}
              <div className="md:hidden ms-auto">
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen} dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-primary/10"
                      aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
                    >
                      {isOpen ? (
                        <X className="h-6 w-6 text-primary" />
                      ) : (
                        <Menu className="h-6 w-6" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={10}
                    className="
                      z-[60]
                      w-[calc(100vw-1.5rem)]
                      max-w-[420px]
                      p-3
                      bg-background/95
                      backdrop-blur-xl
                      border-border/50
                      shadow-2xl
                      max-h-[80vh]
                      overflow-auto
                    "
                  >
                    <div className="space-y-1">
                      {navLinks.map((link) => {
                        const isExternal = link.href.startsWith('/') && !link.href.startsWith('#');
                        return (
                          <DropdownMenuItem key={link.href} className="p-0">
                            {isExternal ? (
                              <Link
                                href={link.href}
                                className="w-full px-4 py-3 text-right text-base font-bold rounded-lg hover:bg-primary/10 hover:text-primary transition block"
                                onClick={() => setIsOpen(false)}
                              >
                                {link.label}
                              </Link>
                            ) : (
                              <button
                                type="button"
                                className="w-full px-4 py-3 text-right text-base font-bold rounded-lg hover:bg-primary/10 hover:text-primary transition"
                                onClick={() => {
                                  setIsOpen(false);
                                  scrollToHash(link.href);
                                }}
                                aria-label={link.ariaLabel}
                              >
                                {link.label}
                              </button>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                      {!isLoaded ? (
                        <div className="space-y-2">
                          <div className="w-full h-11 bg-muted animate-pulse rounded-lg" />
                          <div className="w-full h-11 bg-muted animate-pulse rounded-lg" />
                        </div>
                      ) : isSignedIn ? (
                        <div className="space-y-3">
                          {dashboardData && (
                            <Link href={dashboardData.href} onClick={() => setIsOpen(false)}>
                              <Button className="w-full bg-primary text-white shadow-lg font-bold py-6 text-lg flex items-center justify-center gap-3">
                                <dashboardData.icon className="w-6 h-6" />
                                {dashboardData.label}
                              </Button>
                            </Link>
                          )}
                          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                            <div className="flex items-center gap-3">
                              <UserButton />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold truncate max-w-[150px]">{user?.fullName || user?.username}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                  {userRole || 'قيد الانتظار'}
                                </span>
                              </div>
                            </div>
                            <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                              <Button variant="ghost" size="sm" className="text-destructive font-bold">خروج</Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Link href="/merchant/apply" onClick={() => setIsOpen(false)}>
                            <Button className="w-full bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg font-bold">
                              سجّل كتاجر
                            </Button>
                          </Link>
                          <Link href="/affiliate/register" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full text-primary hover:bg-primary/10 font-bold border-2 border-primary/20">
                              انضم كمسوق
                            </Button>
                          </Link>
                          <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                            <Button variant="outline" className="w-full border-2 font-bold">
                              تسجيل الدخول
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
