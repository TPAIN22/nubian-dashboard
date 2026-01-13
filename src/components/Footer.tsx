"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Smartphone,
} from "lucide-react";

export default function Footer() {
  return (
    <footer
      dir="rtl"
      className="relative overflow-x-hidden bg-gradient-to-br from-background via-background to-background/95 text-foreground py-14 md:py-20 border-t border-border/50"
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient Orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12 pb-10 md:pb-12 mb-10 md:mb-12 border-b border-border/50">
          {/* Section 1: Brand Info */}
          <div className="md:col-span-2 lg:col-span-2 space-y-6 text-center md:text-right">
            {/* ✅ make wrapper relative so glow doesn't overflow */}
            <div className="relative inline-flex justify-center md:justify-end w-full">
              <Link
                href="/"
                className="relative flex items-center gap-3 group"
              >
                <span className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent group-hover:from-primary/90 group-hover:to-primary transition-all duration-300">
                  نـوبـيــــــان
                </span>

                {/* Glow */}
                <div className="pointer-events-none absolute -inset-6 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </Link>
            </div>

            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto md:mr-auto md:ml-0 text-base md:text-lg font-medium">
              منصة التجارة الإلكترونية الرائدة في السودان. اكتشف منتجات فريدة وتسوّق بأمان مع توصيل سريع.
            </p>

            {/* CTA + QR (responsive) */}
            <div className="mt-6 space-y-4 flex flex-col items-center md:items-end">
              <a
                href="https://play.google.com/store/apps/details?id=dev.expo.nubian"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-background/50 border border-border/50 text-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 group"
                aria-label="حمّل تطبيق نوبيان من Google Play"
              >
                <Smartphone className="w-5 h-5" />
                <span className="font-semibold">حمّل التطبيق</span>
                <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <div className="flex flex-col items-center md:items-end gap-2 pt-1">
                <p className="text-xs text-muted-foreground">امسح الكود</p>
                <a
                  href="https://play.google.com/store/apps/details?id=dev.expo.nubian"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-background/50 backdrop-blur-sm p-2 rounded-lg border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105"
                  aria-label="QR Code - حمّل تطبيق نوبيان"
                >
                  <Image
                    src="/qr-code.svg"
                    alt="QR Code - حمّل تطبيق نوبيان"
                    width={112}
                    height={112}
                    className="w-[112px] h-[112px]"
                  />
                </a>
              </div>
            </div>

            {/* Socials */}
            <div className="flex justify-center md:justify-end gap-3 mt-6 flex-wrap">
              {[
                { icon: Facebook, label: "Facebook", href: "#" },
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Twitter, label: "Twitter", href: "#" },
                { icon: Linkedin, label: "LinkedIn", href: "#" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-background/50 border border-border/50 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 hover:scale-110 group"
                >
                  <social.icon className="w-5 h-5" />
                  <div className="absolute inset-0 bg-primary/10 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </a>
              ))}
            </div>
          </div>

          {/* Section 2: Quick Links */}
          <div className="space-y-4 text-center md:text-right">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 relative inline-block">
              روابط سريعة
              <div className="absolute bottom-0 right-0 w-12 h-1 bg-gradient-to-r from-primary to-transparent rounded-full" />
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "الرئيسية" },
                { href: "/about", label: "عن نوبيان" },
                { href: "/contact", label: "اتصل بنا" },
                { href: "/dashboards", label: "لوحة التحكم", special: true },
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className={`group inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 font-medium ${
                      link.special ? "text-primary" : ""
                    }`}
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.label}
                    </span>
                    {link.special ? (
                      <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    ) : (
                      <div className="w-0 h-0.5 bg-gradient-to-r from-primary to-transparent group-hover:w-4 transition-all duration-300" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Support */}
          <div className="space-y-4 text-center md:text-right">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 relative inline-block">
              الدعم
              <div className="absolute bottom-0 right-0 w-12 h-1 bg-gradient-to-r from-accent to-transparent rounded-full" />
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/privacy-policy", label: "سياسة الخصوصية" },
                { href: "/terms-conditions", label: "الشروط والأحكام" },
                { href: "/exchange-policy", label: "سياسة الإرجاع" },
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 font-medium"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.label}
                    </span>
                    <div className="w-0 h-0.5 bg-gradient-to-r from-primary to-transparent group-hover:w-4 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4: Contact Info */}
          <div className="space-y-4 text-center md:text-right md:col-span-1 lg:col-span-1">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 relative inline-block">
              اتصل بنا
              <div className="absolute bottom-0 right-0 w-12 h-1 bg-gradient-to-r from-primary via-accent to-transparent rounded-full" />
            </h3>

            <address className="not-italic space-y-4">
              {[
                { icon: MapPin, text: "شارع النيل، الخرطوم، السودان", href: "#" },
                { icon: Phone, text: "+249 912 345 678", href: "tel:+249912345678" },
                { icon: Mail, text: "info@nubian-sd.info", href: "mailto:info@nubian-sd.info" },
              ].map((contact, index) => (
                <a
                  key={index}
                  href={contact.href}
                  className="inline-flex items-center gap-3 text-muted-foreground hover:text-primary transition-all duration-300 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-300 font-medium">
                    {contact.text}
                  </span>
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-background/50 border border-border/50 group-hover:bg-primary/5 group-hover:border-primary/50 transition-all duration-300">
                    <contact.icon className="w-4 h-4" />
                  </div>
                </a>
              ))}
            </address>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center space-y-4">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 text-sm md:text-base text-muted-foreground font-medium mb-3">
            <div className="w-10 md:w-12 h-px bg-gradient-to-r from-transparent to-border" />
            <span>&copy; {new Date().getFullYear()} نـوبـيــــــان. جميع الحقوق محفوظة.</span>
            <div className="w-10 md:w-12 h-px bg-gradient-to-l from-transparent to-border" />
          </div>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
        </div>
      </div>
    </footer>
  );
}
