"use client";
import React from "react";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import TestimonialsSection from "./TestimonialsSection";
import CtaSection from "./CtaSection";

// استيراد الـ types والبيانات من ملف data.tsx
import { features, stats, testimonials, Stat, Feature, Testimonial } from "./data";

export default function ModernNoubian() {
  return (
    <>
      {/* Hero Banner starts from top */}
      <HeroSection stats={stats} />
      
      <main className="relative z-10">
        <FeaturesSection features={features} />
        <TestimonialsSection testimonials={testimonials} />
        <CtaSection />
      </main>
    </>
  );
}