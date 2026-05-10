import React from "react";
import type { Metadata } from "next";

import { MinimalHero } from "@/components/marketing/MinimalHero";
import { MinimalFeatures } from "@/components/marketing/MinimalFeatures";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { MerchantSection } from "@/components/marketing/MerchantSection";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { TrustSection } from "@/components/marketing/TrustSection";
import { AppDownloadCTA } from "@/components/marketing/AppDownloadCTA";

const baseUrl = "https://nubian-sd.com";

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "نوبيان | سوق عصري للشرق - نوبيان",
  description:
    "نوبيان هي الشركة الرائدة في مجال التجارة الإلكترونية في السودان. تسوق آلاف المنتجات المتميزة مع توصيل سريع وآمن ومدفوعات موثوقة.",
  keywords: [
    "Nubian", "نوبيان", "تجارة إلكترونية السودان", "تسوق السودان", "سوق رقمي"
  ],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "نوبيان | سوق عصري في السودان",
    description: "اختبر التجارة الراقية مع نوبيان. منتجات متميزة، مدفوعات آمنة، ولوجستيات لا مثيل لها.",
    url: baseUrl,
    type: "website",
    siteName: "نوبيان",
    images: [
      {
        url: `${baseUrl}/nubi.png`,
        width: 1200,
        height: 630,
        alt: "سوق نوبيان",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return (
    <div className="bg-white">
      <MinimalHero />
      <MinimalFeatures />
      <HowItWorks />
      <ProductPreview />
      <MerchantSection />
      <TrustSection />
      <AppDownloadCTA />

      {/* SEO Content - Hidden from display but readable by search engines */}
      <div className="sr-only" aria-hidden="true">
        <h1>نوبيان - السوق الرائد في السودان</h1>
        <p>نربط التجار المتميزين مع العملاء المميزين في جميع أنحاء السودان. توفر نوبيان مدفوعات آمنة، ولوجستيات موثوقة، وتجربة تسوق عالمية المستوى.</p>
      </div>
    </div>
  );
}




