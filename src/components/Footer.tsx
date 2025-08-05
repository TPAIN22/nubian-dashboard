"use client";

import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, MapPin, Phone, Mail } from 'lucide-react'; // أيقونات وسائل التواصل الاجتماعي ومعلومات الاتصال

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12" dir="rtl">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 border-b border-slate-700 pb-8 mb-8">
          {/* Section 1: Brand Info */}
          <div className="md:col-span-2 lg:col-span-2 text-right space-y-4">
            <Link href="/" className="flex items-center justify-end gap-2 group">
              <span className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                نـوبـيــــــان
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-md mr-auto">
              منصة التجارة الإلكترونية الرائدة في السودان. اكتشف منتجات فريدة وتسوّق بأمان مع توصيل سريع.
            </p>
            <div className="flex justify-end gap-4 mt-4">
              <a href="#" aria-label="Facebook" className="text-slate-400 hover:text-amber-500 transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" aria-label="Instagram" className="text-slate-400 hover:text-amber-500 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" aria-label="Twitter" className="text-slate-400 hover:text-amber-500 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-slate-400 hover:text-amber-500 transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Section 2: Quick Links */}
          <div className="text-right space-y-3">
            <h3 className="text-xl font-semibold text-white mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  المنتجات
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  المتاجر
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  عن نوبيان
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  اتصل بنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 3: Support */}
          <div className="text-right space-y-3">
            <h3 className="text-xl font-semibold text-white mb-4">الدعم</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  سياسة الشحن
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors">
                  سياسة الإرجاع
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 4: Contact Info (Optional) */}
          <div className="text-right space-y-3 md:col-span-1 lg:col-span-1">
            <h3 className="text-xl font-semibold text-white mb-4">اتصل بنا</h3>
            <address className="not-italic space-y-2">
              <div className="flex items-center justify-end gap-2 text-slate-400">
                <span className="text-right">شارع النيل، الخرطوم، السودان</span>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-end gap-2 text-slate-400">
                <span className="text-right">+249 912 345 678</span>
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-end gap-2 text-slate-400">
                <span className="text-right">info@nubian-sd.info</span>
                <Mail className="w-5 h-5" />
              </div>
            </address>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="text-center text-sm text-slate-500 pt-4">
          &copy; {new Date().getFullYear()} نـوبـيــــــان. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
