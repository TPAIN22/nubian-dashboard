"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
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
import { axiosInstance } from '@/lib/axiosInstance';

export default function Header() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleMerchantPlatformClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isRedirecting) return;
    setIsRedirecting(true);

    try {
      // If user is not loaded, wait or redirect to sign-in
      if (!isLoaded) {
        router.push('/sign-in');
        return;
      }

      // If user is not signed in, redirect to sign-in
      if (!user) {
        router.push('/sign-in');
        return;
      }

      // Check user role
      const role = user.publicMetadata?.role as string | undefined;

      // If user is admin, redirect to admin dashboard
      if (role === 'admin') {
        router.push('/business/dashboard');
        return;
      }

      // If user is merchant, check their merchant status
      if (role === 'merchant') {
        try {
          const token = await getToken();
          if (!token) {
            router.push('/sign-in');
            return;
          }

          const response = await axiosInstance.get('/merchants/my-status', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.hasApplication) {
            const merchantData = response.data.merchant;
            
            // If merchant is approved, go to dashboard
            if (merchantData.status === 'APPROVED') {
              router.push('/merchant/dashboard');
              return;
            }
            
            // If merchant is pending or rejected, go to apply page (which will show status)
            router.push('/merchant/apply');
            return;
          } else {
            // No application, go to apply page
            router.push('/merchant/apply');
            return;
          }
        } catch (error: any) {
          // If API call fails, still redirect to apply page
          // The apply page will handle the error gracefully
          router.push('/merchant/apply');
          return;
        }
      }

      // If user doesn't have merchant role, redirect to apply page
      router.push('/merchant/apply');
    } catch (error) {
      // On any error, redirect to apply page
      router.push('/merchant/apply');
    } finally {
      setIsRedirecting(false);
    }
  };
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
          <Link href="/contact" className="hover:text-amber-500 transition-colors">
            اتصل بنا
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            size="sm"
            onClick={handleMerchantPlatformClick}
            disabled={isRedirecting}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
          >
            {isRedirecting ? 'جاري التحميل...' : 'منــصـــة التاجــر'}
          </Button>
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
                <Link href="/sign-in" className="block py-2 text-right hover:bg-slate-50 rounded-md">لــوحــة التحــكــم</Link>
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
                <Button
                  size="sm"
                  onClick={handleMerchantPlatformClick}
                  disabled={isRedirecting}
                  className="w-full text-center justify-end bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
                >
                  {isRedirecting ? 'جاري التحميل...' : 'منـــــصــــة التــاجـــر'}
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
