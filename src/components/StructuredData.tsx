import React from "react";

const baseUrl = "https://nubian-sd.com";

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
    "email": "info@nubian-sd.com",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+966-583-104-518",
      "email": "info@nubian-sd.com",
      "contactType": "customer service",
      "areaServed": "SD",
      "availableLanguage": ["Arabic", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "شارع النيل",
      "addressLocality": "الخرطوم",
      "addressRegion": "Khartoum",
      "postalCode": "11111",
      "addressCountry": "SD"
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
      "streetAddress": "شارع النيل",
      "addressLocality": "الخرطوم",
      "addressRegion": "Khartoum",
      "postalCode": "11111",
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
    "telephone": "+966-583-104-518",
    "email": "info@nubian-sd.com",
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "الرئيسية | Home",
        "item": baseUrl
      }
    ]
  };

  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    "name": "Nubian",
    "alternateName": ["نوبيان", "Nubian Sudan", "Nubian SD", "متجر نوبيان"],
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "slogan": "سوق السودان الإلكتروني الأول",
    "description": "نوبيان (Nubian) العلامة التجارية الرائدة للتجارة الإلكترونية في السودان."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "ما هو نوبيان؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "نوبيان (Nubian) هو أكبر متجر إلكتروني في السودان، يربط آلاف التجار بالعملاء في جميع أنحاء البلاد مع شحن سريع ومدفوعات آمنة."
        }
      },
      {
        "@type": "Question",
        "name": "What is Nubian?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nubian (نوبيان) is Sudan's leading e-commerce marketplace, connecting thousands of merchants with customers across the country with fast shipping and secure payments."
        }
      },
      {
        "@type": "Question",
        "name": "هل نوبيان يشحن لجميع أنحاء السودان؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "نعم، يقدم نوبيان خدمة الشحن السريع والآمن إلى جميع ولايات السودان."
        }
      },
      {
        "@type": "Question",
        "name": "Is Nubian available on mobile?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Nubian is available as a mobile app for iOS and Android, and as a web platform at nubian-sd.com."
        }
      },
      {
        "@type": "Question",
        "name": "كيف أصبح بائعًا في نوبيان؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "يمكن للتجار التقديم عبر صفحة 'انضم كتاجر' في موقع نوبيان، وبعد الموافقة يحصلون على لوحة تحكم كاملة لإدارة منتجاتهم وطلباتهم."
        }
      }
    ]
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

