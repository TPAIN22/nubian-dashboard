"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react'; // أيقونة القائمة للجوال
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full py-4" dir="rtl">
      <div className="container mx-auto max-w-7xl bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm shadow-sm border border-white/20 dark:border-white/10 rounded-2xl px-6 md:px-12 flex items-center relative h-20">
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0 absolute left-6 md:left-12" aria-label="نوبيان - Nubian الصفحة الرئيسية">
         <Image src="/logo.png" alt="نوبيان - Nubian Logo" width={50} height={50} priority />
        </Link>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-8 text-slate-700 font-medium mx-auto">
          <Link href="/about" className="hover:text-amber-500 transition-colors">
            عن نوبيان
          </Link>
          <Link href="/contact" className="hover:text-amber-500 transition-colors">
            اتصل بنا
          </Link>
        </nav>

        {/* Mobile Navigation (Dropdown) */}
        <div className="md:hidden flex-shrink-0"> {/* هذا الـ div سيظهر فقط على الشاشات الأصغر من md */}
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              {/* زر القائمة للجوال، تأكد من حجمه المناسب للمس */}
              <Button variant="outline" size="icon" className="h-10 w-10 "> {/* زيادة حجم الزر قليلاً */}
                <Menu className="h-6 w-6" />
                <span className="sr-only ">فتح القائمة</span> {/* نص مخفي لتحسين إمكانية الوصول */}
              </Button>
            </DropdownMenuTrigger>
            {/* محتوى القائمة المنسدلة للجوال */}
            <DropdownMenuContent align="end" className="w-56 p-2"> {/* إضافة padding للقائمة */}
              <DropdownMenuItem asChild>
                <Link href="/about" className="block py-2 text-right hover:bg-slate-50 rounded-md">عــن نـوبـيـان</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact" className="block py-2 text-right hover:bg-slate-50 rounded-md">اتـصــل بـنـا</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
