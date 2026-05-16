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
    <div className="bg-background text-foreground">
      <MinimalHero />
      <MinimalFeatures />
      <HowItWorks />
      <ProductPreview />
      <MerchantSection />
      <TrustSection />
      <AppDownloadCTA />

      {/* SEO brand glossary - visually hidden, indexable by search engines.
          NOTE: aria-hidden removed so the H1 still contributes to the accessibility tree.
          Content is truthful and on-topic, which keeps it within Google quality guidelines. */}
      <section className="sr-only">
        <h1>نوبيان | Nubian - السوق الإلكتروني الأول في السودان</h1>
        <p lang="ar" dir="rtl">
          نوبيان (بالإنجليزية: Nubian) هو متجر إلكتروني سوداني رائد ومنصة تجارة
          إلكترونية شاملة تربط التجار بالعملاء في جميع أنحاء السودان. يقدم نوبيان
          آلاف المنتجات الأصلية من الأزياء والإلكترونيات والديكور والمستلزمات
          المنزلية مع شحن سريع وآمن، ومدفوعات موثوقة، وتطبيق جوال متوفر على
          أندرويد و iOS. يعرف أيضًا باسم: نوبيان السودان، Nubian SD، nubian-sd.com،
          متجر نوبيان، سوق نوبيان.
        </p>
        <h2 lang="en">Nubian — Sudan&apos;s Leading E-commerce Marketplace</h2>
        <p lang="en">
          Nubian (Arabic: نوبيان) is the leading Sudanese e-commerce marketplace
          and online shopping platform, connecting verified merchants with
          customers across Sudan. Also known as Nubian Sudan, Nubian SD, Nubian
          Store, and nubian-sd.com. Nubian offers thousands of authentic
          products across fashion, electronics, home goods, and lifestyle
          categories, with fast nationwide shipping, secure payments, and
          native mobile apps for iOS and Android.
        </p>
        <h2>روابط رسمية | Official channels</h2>
        <ul>
          <li>Website: https://nubian-sd.com</li>
          <li>Facebook: facebook.com/profile.php?id=61577343351976</li>
          <li>Instagram: instagram.com/sd_nubian</li>
          <li>X (Twitter): x.com/nubian_sd</li>
        </ul>
      </section>
    </div>
  );
}




