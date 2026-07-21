import React from "react";

const baseUrl = "https://nubian-sd.com";

const alternateNames = [
  "Nubian",
  "نوبيان",
  "Nubian Sudan",
  "نوبيان سودان",
  "Nubian SD",
  "Nubian Store",
  "متجر نوبيان",
];

const socialProfiles = [
  "https://www.facebook.com/profile.php?id=61577343351976",
  "https://www.instagram.com/sd_nubian",
  "https://x.com/nubian_sd",
];

/**
 * Sitewide structured data (Organization + WebSite).
 * Rendered once in the root layout. Kept intentionally lean so it is valid
 * on every route without asserting page-specific or unverifiable claims.
 */
export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Nubian",
    alternateName: alternateNames,
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${baseUrl}/nubi.png`,
    description:
      "Nubian (نوبيان) is a Sudanese e-commerce marketplace connecting merchants with customers across Sudan, with fast shipping and secure payments.",
    sameAs: socialProfiles,
    email: "info@nubian-sd.com",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+966-583-104-518",
      email: "info@nubian-sd.com",
      contactType: "customer service",
      areaServed: "SD",
      availableLanguage: ["Arabic", "English"],
    },
    areaServed: {
      "@type": "Country",
      name: "Sudan",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "نوبيان | Nubian",
    alternateName: alternateNames,
    url: baseUrl,
    description:
      "نوبيان (Nubian) - متجر إلكتروني في السودان. تسوق منتجات أصلية مع شحن سريع وآمن.",
    inLanguage: ["ar", "en"],
    publisher: { "@id": `${baseUrl}/#organization` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

/**
 * Homepage-only structured data (OnlineStore + Brand + BreadcrumbList).
 * Rendered on the marketing homepage where the storefront context applies.
 */
export function HomeStructuredData() {
  const onlineStoreSchema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${baseUrl}/#store`,
    name: "نوبيان | Nubian",
    description: "متجر نوبيان للتسوق الإلكتروني في السودان",
    url: baseUrl,
    image: `${baseUrl}/nubi.png`,
    logo: `${baseUrl}/logo.png`,
    priceRange: "$$",
    parentOrganization: { "@id": `${baseUrl}/#organization` },
    areaServed: { "@type": "Country", name: "Sudan" },
    telephone: "+966-583-104-518",
    email: "info@nubian-sd.com",
    sameAs: socialProfiles,
    paymentAccepted: "Cash, Credit Card, Bank Transfer",
    currenciesAccepted: "SDG, USD",
  };

  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    "@id": `${baseUrl}/#brand`,
    name: "Nubian",
    alternateName: alternateNames,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "نوبيان (Nubian) علامة تجارية للتجارة الإلكترونية في السودان.",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية | Home",
        item: baseUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(onlineStoreSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
