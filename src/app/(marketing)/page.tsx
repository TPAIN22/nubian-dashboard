/**
 * Nubian homepage — premium minimal.
 *
 *   Hero         tinted panel: statement, two actions, three facts, one still
 *   Departments  square photo tiles (rail on a phone, six-up on desktop)
 *   Trending     the live product feed, eight cards
 *   Collection   admin-curated collection(s), banner card or grid
 *   Arrivals     only when the backend fills it
 *   Stores       approved merchants
 *   Assurance    four checkable reasons to shop here
 *   App          the one dark band: order in the Android app
 *   Partner      doors for merchants and marketers
 *
 * Server-rendered from one pass over the public feed; data-driven sections
 * hide themselves when their data is empty.
 */

import type { Metadata } from "next";

import { HomeHero } from "@/components/storefront/home/HomeHero";
import { HomeCategories } from "@/components/storefront/home/HomeCategories";
import { HomeProducts, HomeNewArrivals } from "@/components/storefront/home/HomeProducts";
import { HomeCollections } from "@/components/storefront/home/HomeCollections";
import { HomeStores } from "@/components/storefront/home/HomeStores";
import { HomeAssurance } from "@/components/storefront/home/HomeAssurance";
import { HomeAppBanner } from "@/components/storefront/home/HomeAppBanner";
import { HomePartner } from "@/components/storefront/home/HomePartner";
import { HomeStructuredData } from "@/components/StructuredData";
import { visibleCategories } from "@/components/storefront/CategoryTile";
import { getCategories, getHomeFeed } from "@/lib/storefront/api";

const baseUrl = "https://nubian-sd.com";

/** Matches the backend's own three-minute cache on `/api/home`. */
export const revalidate = 180;

export const metadata: Metadata = {
  title: "نوبيان | تطبيق سوداني للتسوق الالكتروني  - نوبيان",
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

export default async function Page() {
  // Departments come from `/categories`, not from the home feed's own slice of
  // them. The feed caps at 12 while the taxonomy has 14, so the two disagree —
  // and the header and footer already read `/categories`. Sourcing all three
  // from one endpoint is what stops the homepage grid from advertising
  // different departments than the navigation above it.
  const [feed, categories] = await Promise.all([getHomeFeed(), getCategories()]);

  return (
    <>
      <HomeStructuredData />

      <HomeHero departmentCount={visibleCategories(categories, 99).length} />
      <HomeCategories categories={categories} />
      <HomeProducts products={feed.products} />
      <HomeCollections collections={feed.collections} />
      <HomeNewArrivals products={feed.newArrivals} />
      <HomeStores stores={feed.stores} />
      <HomeAssurance />
      <HomeAppBanner />
      <HomePartner />

      {/* SEO brand glossary - visually hidden, indexable by search engines.
          NOTE: aria-hidden removed so the H1 still contributes to the accessibility tree.
          Content is truthful and on-topic, which keeps it within Google quality guidelines. */}
      <section className="sr-only" aria-label="نبذة عن نوبيان | About Nubian">
        <h2>نوبيان | Nubian - المنصة الأولى في السودان</h2>
        <p lang="ar" dir="rtl">
          نوبيان ( Nubian) هو منصة سودانية رائدة ومنصة تجارة
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
    </>
  );
}
