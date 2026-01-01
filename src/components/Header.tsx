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
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu'; // تأكد من أن هذا الاستيراد صحيح
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md shadow-sm border-b border-slate-100 py-4" dir="rtl">
      <div className="container mx-auto flex items-center sm:justify-around justify-between px-6 md:px-12">
        <Link href="/" className="flex items-center gap-2 group" aria-label="نوبيان - Nubian الصفحة الرئيسية">
         <Image src="/logo.png" alt="نوبيان - Nubian Logo" width={50} height={50} priority />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-slate-700 font-medium">
          <Link href="#" className="hover:text-amber-500 transition-colors">
            لوحة التحكم 
          </Link>
          <Link href="/about" className="hover:text-amber-500 transition-colors">
            عن نوبيان
          </Link>
          <Link href="/" className="hover:text-amber-500 transition-colors">
            اتصل بنا
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
         <Link href="#">
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
          >
           منــصـــة التاجــر
          </Button>
          </Link>
        </div>

        {/* Mobile Navigation (Dropdown) */}
        <div className="md:hidden bg-amber-500 rounded-lg"> {/* هذا الـ div سيظهر فقط على الشاشات الأصغر من md */}
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
                <Link href="#" className="block py-2 text-right hover:bg-slate-50 rounded-md">لــوحــة التحــكــم</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/about" className="block py-2 text-right hover:bg-slate-50 rounded-md">عــن نـوبـيـان</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact" className="block py-2 text-right hover:bg-slate-50 rounded-md">اتـصــل بـنـا</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
              <Link href="#" className="block py-2 hover:bg-slate-50 rounded-md">
                <Button
                  size="sm"
                  className="w-full text-center justify-end bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
                >
                  منـــــصــــة التــاجـــر 
                </Button>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
