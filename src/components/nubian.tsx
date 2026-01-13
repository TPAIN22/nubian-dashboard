"use client";
import React from "react";
import HeroSection from "./HeroSection";
import MerchantHighlight from "./MerchantHighlight";
import ShopperHighlight from "./ShopperHighlight";
import HowItWorks from "./HowItWorks";
import FeaturesSection from "./FeaturesSection";
import TestimonialsSection from "./TestimonialsSection";
import FAQ from "./FAQ";
import CtaSection from "./CtaSection";

// استيراد الـ types والبيانات من ملف data.tsx
import { features, stats, testimonials, Stat, Feature, Testimonial } from "./data";

export default function ModernNoubian() {
  return (
    <>
      {/* Hero Banner starts from top */}
      <HeroSection stats={stats} />
      
      <main className="relative z-10">
        {/* Merchant Highlight Section */}
        <MerchantHighlight />
        
        {/* Shopper Highlight Section */}
        <ShopperHighlight />
        
        {/* How It Works Section */}
        <HowItWorks />
        
        {/* Features Section (existing) */}
        <FeaturesSection features={features} />
        
        {/* Testimonials Section (existing) */}
        <TestimonialsSection testimonials={testimonials} />
        
        {/* FAQ Section */}
        <FAQ />
        
        {/* Final CTA Section */}
        <CtaSection />
      </main>
    </>
  );
}