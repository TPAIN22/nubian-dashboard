import React from "react";
import ModernNoubian from "@/components/nubian";
import RoleBasedRedirect from "@/components/RoleBasedRedirect";
import type { Metadata } from "next";

const baseUrl = "https://nubian-sd.store";

export const metadata: Metadata = {
  title: "نوبيان | Nubian - أفضل متجر إلكتروني في السودان",
  description:
    "نوبيان (Nubian) - متجر إلكتروني رائد في السودان. تسوق آلاف المنتجات الأصلية من الأزياء، الإلكترونيات، ديكور المنزل والمزيد. شحن سريع وآمن إلى جميع أنحاء السودان. اكتشف منصة نوبيان للتسوق الرقمي الآن.",
  keywords: [
    "نوبيان",
    "Nubian",
    "نوبيان سودان",
    "Nubian Sudan",
    "متجر نوبيان",
    "nubian store",
    "تسوق إلكتروني السودان",
    "online shopping Sudan",
  ],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "نوبيان | Nubian - أفضل متجر إلكتروني في السودان",
    description: "نوبيان (Nubian) - متجر إلكتروني رائد في السودان. تسوق آلاف المنتجات الأصلية مع شحن سريع وآمن.",
    url: baseUrl,
    type: "website",
    siteName: "نوبيان | Nubian",
    images: [
      {
        url: `${baseUrl}/nubi.png`,
        width: 1200,
        height: 630,
        alt: "نوبيان | Nubian - متجر إلكتروني",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function Page() {
  return (
    <>
      <RoleBasedRedirect />
      <ModernNoubian />

      {/* SEO-Optimized Hidden Content for Search Engines */}
      <div className="pt-2 overflow-x-hidden">
        <h1>نوبيان - Nubian: أفضل متجر إلكتروني في السودان</h1>
        <h2>متجر نوبيان للتسوق الإلكتروني | Nubian Online Store Sudan</h2>
        <p>
          نوبيان Nubian هو متجر إلكتروني رائد في السودان يوفر آلاف المنتجات الأصلية من أفضل التجار. تسوق من نوبيان
          واحصل على الأزياء، الإلكترونيات، ديكور المنزل والمزيد مع شحن سريع وآمن إلى جميع أنحاء السودان. اكتشف منصة نوبيان
          للتسوق الرقمي الآن.
        </p>
        <p>
          Nubian is a leading online store in Sudan offering thousands of authentic products from trusted sellers. Shop
          at Nubian for fashion, electronics, home decor and more with fast and secure shipping across Sudan. Discover
          the Nubian digital shopping platform now.
        </p>
        <ul>
          <li>نوبيان سودان | Nubian Sudan</li>
          <li>متجر نوبيان | Nubian Store</li>
          <li>تسوق إلكتروني السودان | Online Shopping Sudan</li>
          <li>نوبيان للتسوق | Nubian Shopping</li>
          <li>منتجات سودانية | Sudanese Products</li>
        </ul>
      </div>
    </>
  );
}




