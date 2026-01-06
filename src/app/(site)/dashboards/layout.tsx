import type { Metadata } from "next";

const baseUrl = "https://nubian-sd.store";

export const metadata: Metadata = {
  title: "لوحات التحكم - نوبيان",
  description: "اختر لوحة التحكم المناسبة لك - لوحة تحكم الإدارة أو لوحة تحكم التاجر. إدارة شاملة لعملك على منصة نوبيان.",
  alternates: {
    canonical: `${baseUrl}/dashboards`,
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
    title: "لوحات التحكم - نوبيان",
    description: "اختر لوحة التحكم المناسبة لك - لوحة تحكم الإدارة أو لوحة تحكم التاجر.",
    url: `${baseUrl}/dashboards`,
    type: "website",
    siteName: "نوبيان | Nubian",
    images: [
      {
        url: `${baseUrl}/nubi.png`,
        width: 1200,
        height: 630,
        alt: "لوحات التحكم - نوبيان",
      },
    ],
  },
};

export default function DashboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}



