"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

type NavLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

const NAV_LINKS: NavLink[] = [
  {
    href: '#shoppers',
    label: 'للمشترين',
    ariaLabel: 'للمشترين - For Shoppers',
  },
  {
    href: '#merchants',
    label: 'للتجار',
    ariaLabel: 'للتجار - For Merchants',
  },
  {
    href: '#faq',
    label: 'الأسئلة الشائعة',
    ariaLabel: 'الأسئلة الشائعة - FAQ',
  },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'py-2' : 'py-4'
      }`} 
      dir="rtl"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div 
          className={`relative flex items-center justify-between transition-all duration-300 rounded-2xl ${
            isScrolled 
              ? 'bg-background/95 shadow-lg border border-border/50 backdrop-blur-xl h-16' 
              : 'bg-background/80 shadow-md border border-border/30 backdrop-blur-lg h-20'
          }`}
        >
          {/* Logo - Right Side (RTL) */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group flex-shrink-0 pr-6 md:pr-8 relative z-10" 
            aria-label="نوبيان - Nubian الصفحة الرئيسية"
          >
            <div className="relative">
              <Image 
                src="/logo.png" 
                alt="نوبيان - Nubian Logo" 
                width={isScrolled ? 40 : 50} 
                height={isScrolled ? 40 : 50} 
                priority 
                className="transition-all duration-300 group-hover:scale-110"
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-0 group-hover:scale-150 transition-transform duration-300" />
            </div>
            
            {/* Optional: Brand name next to logo */}
            <span className="hidden sm:block text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent group-hover:from-primary/90 group-hover:to-primary transition-all duration-300">
              نوبيان
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav 
            className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            aria-label="Primary Navigation"
          >
            {NAV_LINKS.map((link, index) => (
              <a
                key={`nav-${index}`}
                href={link.href}
                className="relative px-6 py-2 text-base font-bold text-foreground/80 hover:text-primary transition-all duration-300 group"
                aria-label={link.ariaLabel}
                onClick={(e) => {
                  if (link.href.startsWith('#')) {
                    e.preventDefault();
                    const element = document.querySelector(link.href);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span className="relative z-10">{link.label}</span>
                
                {/* Hover background effect */}
                <div className="absolute inset-0 bg-primary/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300" />
                
                {/* Bottom border animation */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Desktop CTA Buttons - Left Side (RTL) */}
          <div className="hidden md:flex items-center gap-3 absolute left-0 pl-6">
            <Link href="/merchant/apply">
              <Button 
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-bold px-6 py-2"
                aria-label="سجّل كتاجر - Register as Merchant"
              >
                سجّل كتاجر
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button 
                variant="outline"
                className="border-2 border-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 font-bold px-5 py-2"
                aria-label="تسجيل الدخول - Sign In"
              >
                تسجيل الدخول
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button - Left Side (RTL) */}
          <div className="md:hidden flex items-center pl-4">
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen} dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`relative transition-all duration-300 hover:bg-primary/10 hover:scale-105 ${
                    isScrolled ? 'h-10 w-10' : 'h-12 w-12'
                  }`}
                  aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                >
                  <div className="relative">
                    {isOpen ? (
                      <X className="h-6 w-6 text-primary animate-in spin-in-180 duration-200" />
                    ) : (
                      <Menu className="h-6 w-6 text-foreground animate-in fade-in duration-200" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="start" 
                className="w-64 p-3 mt-2 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
                sideOffset={8}
              >
                {NAV_LINKS.map((link, index) => (
                  <DropdownMenuItem 
                    key={`mobile-nav-${index}`}
                    asChild
                    className="p-0 focus:bg-transparent"
                  >
                    <a 
                      href={link.href} 
                      className="flex items-center w-full px-4 py-3 text-base font-bold text-right text-foreground/90 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 group"
                      onClick={(e) => {
                        setIsOpen(false);
                        if (link.href.startsWith('#')) {
                          e.preventDefault();
                          const element = document.querySelector(link.href);
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      aria-label={link.ariaLabel}
                    >
                      <span className="flex-1">{link.label}</span>
                      
                      {/* Arrow indicator */}
                      <svg 
                        className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </a>
                  </DropdownMenuItem>
                ))}
                
                {/* Mobile CTAs */}
                <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
                  <Link href="/merchant/apply" onClick={() => setIsOpen(false)}>
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg font-bold"
                      aria-label="سجّل كتاجر - Register as Merchant"
                    >
                      سجّل كتاجر
                    </Button>
                  </Link>
                  <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                    <Button 
                      variant="outline"
                      className="w-full border-2 font-bold"
                      aria-label="تسجيل الدخول - Sign In"
                    >
                      تسجيل الدخول
                    </Button>
                  </Link>
                </div>
                
                {/* Decorative bottom border */}
                <div className="mt-2 pt-2 border-t border-border/30">
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-transparent rounded-full mx-auto" />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Decorative gradient line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </div>

      {/* Backdrop overlay when mobile menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}