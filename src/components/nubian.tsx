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
    <div dir="rtl" className="min-h-screen main-bg">
      <AnimatedBackground />
      
      {/* Hero Banner starts from top */}
      <HeroSection stats={stats} />
      
      {/* Header overlays the banner */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      <main className="relative z-10">
        <FeaturesSection features={features} />
        <TestimonialsSection testimonials={testimonials} />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}