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

import { features, stats, testimonials } from "./data";

export default function ModernNoubian() {
  return (
    <>
      {/* Offset for fixed header (h-20 = 80px, h-16 = 64px when scrolled) */}
      <div className="pt-20 md:pt-24">
        <HeroSection stats={stats} />
      </div>

      <main className="relative z-10">
        <MerchantHighlight />
        <ShopperHighlight />
        <HowItWorks />
        <FeaturesSection features={features} />
        <TestimonialsSection testimonials={testimonials} />
        <FAQ />
        <CtaSection />
      </main>
    </>
  );
}
