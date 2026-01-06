"use client";

import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, MapPin, Phone, Mail } from 'lucide-react'; // أيقونات وسائل التواصل الاجتماعي ومعلومات الاتصال

export default function Footer() {
  return (
    <footer className="bg-white text-foreground py-12" dir="rtl">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 border-b border-border pb-8 mb-8">
          {/* Section 1: Brand Info */}
          <div className="md:col-span-2 lg:col-span-2 text-right space-y-4">
            <Link href="/" className="flex items-center justify-end gap-2 group">
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                نـوبـيــــــان
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-md mr-auto">
              منصة التجارة الإلكترونية الرائدة في السودان. اكتشف منتجات فريدة وتسوّق بأمان مع توصيل سريع.
            </p>
            <div className="flex justify-end gap-4 mt-4">
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div className="text-right space-y-3">
            <h3 className="text-xl font-semibold text-foreground mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  عن نوبيان
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  اتصل بنا
                </Link>
              </li>
              <li>
                <Link href="/dashboards" className="text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span>لوحة التحكم</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 3: Support */}
          <div className="text-right space-y-3">
            <h3 className="text-xl font-semibold text-foreground mb-4">الدعم</h3>
            <ul className="space-y-2">
              
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="text-muted-foreground hover:text-primary transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/exchange-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  سياسة الإرجاع
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 4: Contact Info (Optional) */}
          <div className="text-right space-y-3 md:col-span-1 lg:col-span-1">
            <h3 className="text-xl font-semibold text-foreground mb-4">اتصل بنا</h3>
            <address className="not-italic space-y-2">
              <div className="flex items-center justify-end gap-2 text-muted-foreground">
                <span className="text-right">شارع النيل، الخرطوم، السودان</span>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-end gap-2 text-muted-foreground">
                <span className="text-right">+249 912 345 678</span>
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-end gap-2 text-muted-foreground">
                <span className="text-right">info@nubian-sd.info</span>
                <Mail className="w-5 h-5" />
              </div>
            </address>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          &copy; {new Date().getFullYear()} نـوبـيــــــان. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
