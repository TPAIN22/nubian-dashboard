import type { Metadata } from 'next';

const baseUrl = "https://nubian-sd.store";

export const metadata: Metadata = {
  title: "الشروط والأحكام | نوبيان Nubian",
  description: "الشروط والأحكام لاستخدام متجر نوبيان - اقرأ القواعد واللوائح الخاصة باستخدام منصة نوبيان للتسوق الإلكتروني.",
  alternates: {
    canonical: `${baseUrl}/terms-conditions`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "الشروط والأحكام | نوبيان Nubian",
    description: "الشروط والأحكام لاستخدام متجر نوبيان - اقرأ القواعد واللوائح الخاصة باستخدام منصة نوبيان للتسوق الإلكتروني.",
    url: `${baseUrl}/terms-conditions`,
    type: "website",
    siteName: "نوبيان | Nubian",
    images: [
      {
        url: `${baseUrl}/nubi.png`,
        width: 1200,
        height: 630,
        alt: "الشروط والأحكام | Terms and Conditions",
      },
    ],
  },
};

export default function TermsConditionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

