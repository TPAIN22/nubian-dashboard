"use client";

import React from "react";

const baseUrl = "https://nubian-sd.store";

export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Nubian",
    "alternateName": ["Nubian", "نوبيان", "Nubian Store", "متجر نوبيان", "Nubian Sudan" ,"nubian sd" ,"نوبيان | Nubian"],
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Nubian (Nubian) - أفضل متجر إلكتروني في السودان. تسوق آلاف المنتجات الأصلية من الأزياء والإلكترونيات والديكور.",
    "sameAs": [
      // Add social media links when available
      "https://www.facebook.com/profile.php?id=61577343351976",
      "https://www.instagram.com/sd_nubian?igsh=dXBrY3FraWppMnox",
      "https://x.com/nubian_sd",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+249-912-345-678",
      "contactType": "customer service",
      "areaServed": "SD",
      "availableLanguage": ["Arabic", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "شارع النيل",
      "addressLocality": "الخرطوم",
      "addressCountry": "SD",
      "addressRegion": "Khartoum"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Sudan"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "نوبيان | Nubian",
    "alternateName": ["Nubian", "نوبيان"],
    "url": baseUrl,
    "description": "نوبيان (Nubian) - أفضل متجر إلكتروني في السودان. تسوق آلاف المنتجات الأصلية.",
    "inLanguage": ["ar", "en"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "name": "نوبيان | Nubian",
    "description": "متجر نوبيان للتسوق الإلكتروني في السودان",
    "url": baseUrl,
    "image": `${baseUrl}/nubi.png`,
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "الخرطوم",
      "addressRegion": "Khartoum",
      "addressCountry": "SD"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "15.5007",
      "longitude": "32.5599"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "telephone": "+249-912-345-678",
    "email": "info@nubian-sd.info",
    "paymentAccepted": "Cash, Credit Card, Bank Transfer",
    "currenciesAccepted": "SDG, USD"
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "منتجات نوبيان | Nubian Products",
    "description": "آلاف المنتجات الأصلية من الأزياء والإلكترونيات والديكور",
    "url": baseUrl,
    "numberOfItems": "50000+"
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
    </>
  );
}

