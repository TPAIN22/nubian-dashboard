import React from "react";

import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesGrid } from "@/components/marketing/FeaturesGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { PartnersSection } from "@/components/marketing/PartnersSection";
import type { Metadata } from "next";

const baseUrl = "https://nubian-sd.store";

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "نوبيان | Nubian - مستقبل التجارة الإلكترونية في السودان",
  description:
    "نوبيان (Nubian) - منصة إلكترونية رائدة في السودان. تسوق آلاف المنتجات الأصلية من الأزياء، الإلكترونيات، ديكور المنزل والمزيد. شحن سريع وآمن.",
  keywords: [
    "نوبيان", "Nubian", "تسوق إلكتروني", "السودان", "متجر", "Sudaan", "Khartoum"
  ],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "نوبيان | Nubian - مستقبل التجارة الإلكترونية في السودان",
    description: "تسوق بثقة مع نوبيان. أفضل المنتجات، أسرع توصيل، وأكثر طرق الدفع أماناً.",
    url: baseUrl,
    type: "website",
    siteName: "نوبيان | Nubian",
    images: [
      {
        url: `${baseUrl}/nubi.png`,
        width: 1200,
        height: 630,
        alt: "نوبيان | Nubian",
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
    <>
      <HeroSection />
      <FeaturesGrid />
      <PartnersSection />
      <CTASection />

      {/* SEO Content - Hidden from display but readable by search engines */}
      <div className="sr-only" aria-hidden="true">
        <p>نوبيان أفضل منصة إلكتروني في السودان. نوبيان Nubian هو منصة إلكترونية رائدة في السودان توفر آلاف المنتجات الأصلية.</p>
      </div>
    </>
  );
}




