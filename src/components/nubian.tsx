"use client";
import React from "react";
import Header from "@/components/Header";
import Footer from "./Footer";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import TestimonialsSection from "./TestimonialsSection";
import CtaSection from "./CtaSection";
import AnimatedBackground from "./AnimatedBackground";

// استيراد الـ types والبيانات من ملف data.tsx
import { features, stats, testimonials, Stat, Feature, Testimonial } from "./data";

export default function ModernNoubian() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      <AnimatedBackground />

      <main className="relative z-10">
        <HeroSection stats={stats} />
        <FeaturesSection features={features} />
        <TestimonialsSection testimonials={testimonials} />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}