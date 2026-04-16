"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "./BrandLogo"
import { IconMenu2, IconX } from "@tabler/icons-react"

const navLinks = [
  { name: "الرئيسية", href: "/" },
  { name: "ابدأ البيع", href: "/merchant/apply" },
]

export function MinimalNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        isScrolled 
          ? "bg-white/80 backdrop-blur-md border-zinc-200 py-3" 
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="container max-w-7xl mx-auto px-6 flex items-center justify-between">
        <BrandLogo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-zinc-950",
                pathname === link.href ? "text-zinc-950" : "text-zinc-500"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-sm font-medium px-4">
              تسجيل الدخول
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-full px-6 text-sm font-medium">
              انضم إلينا
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-zinc-950"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-zinc-200 p-6 flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-4 text-right">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-lg font-medium text-zinc-950"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100">
            <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center rounded-full h-12">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full justify-center bg-zinc-950 text-white rounded-full h-12">
                انضم إلينا
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
