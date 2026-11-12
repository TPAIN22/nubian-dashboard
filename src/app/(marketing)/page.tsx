/**
 * Nubian homepage — one afternoon, from the first frame to the last.
 *
 * Art direction: hard Sudanese daylight on objects. Every campaign still is
 * shot in raking sun with long shadows on stone, plaster and cloth, and
 * carries the same warm grade (`.sf-grade`). That is the light the strongest
 * merchant photography in the catalogue already uses, which is what lets the
 * campaign hand over to real products without a change of world. See
 * `public/story/ASSETS.md` for every asset and why it was chosen.
 *
 *   Opening      sand     an amber bottle in the sun; the promise; the CTA
 *   Departments  ink      pinned, three frames, each a live department
 *   ——— handover ————————————————————————————————————————————————————————
 *   Shelf        white    the live feed, every product at one honest scale
 *   Index        sand     every department, typographic
 *   Collection · Arrivals · Stores · Assurance · Partners
 *   Closing      plaster  a palm's shadow; the one thing left — the app
 *
 * The story is a way into the shop, never a gate: the opening is not pinned,
 * its first scroll moves the page, and the sticky header carries search and
 * department navigation at every scroll position.
 *
 * Server-rendered from one pass over the public feed; data-driven sections
 * hide themselves when their data is empty. Motion is CSS scroll-timelines
 * only (see the STORY block in globals.css) — no animation library.
 */

import type { Metadata } from "next";

import { StoryOpening } from "@/components/storefront/story/StoryOpening";
import { StoryDiscovery } from "@/components/storefront/story/StoryDiscovery";
import { StoryProductShowcase } from "@/components/storefront/story/StoryProductShowcase";
import { StoryClosing } from "@/components/storefront/story/StoryClosing";
import { HomeCategories } from "@/components/storefront/home/HomeCategories";
import { HomeNewArrivals } from "@/components/storefront/home/HomeProducts";
import { HomeCollections } from "@/components/storefront/home/HomeCollections";
import { HomeStores } from "@/components/storefront/home/HomeStores";
import { HomeAssurance } from "@/components/storefront/home/HomeAssurance";
import { HomePartner } from "@/components/storefront/home/HomePartner";
import { HomeStructuredData } from "@/components/StructuredData";
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

      {/* Campaign */}
      <StoryOpening />
      <StoryDiscovery categories={categories} />

      {/* Handover: from here down is the catalogue. */}
      <StoryProductShowcase products={feed.products} />
      <HomeCategories categories={categories} />
      <HomeCollections collections={feed.collections} />
      <HomeNewArrivals products={feed.newArrivals} />
      <HomeStores stores={feed.stores} />
      <HomeAssurance />
      <HomePartner />

      {/* The last frame. */}
      <StoryClosing />

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
