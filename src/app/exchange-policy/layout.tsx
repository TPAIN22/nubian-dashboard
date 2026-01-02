import type { Metadata } from 'next';

const baseUrl = "https://nubian-sd.store";

export const metadata: Metadata = {
  title: "سياسة الاستبدال | نوبيان Nubian",
  description: "سياسة الاستبدال لمتجر نوبيان - تعرف على شروط وإجراءات استبدال المنتجات في متجر نوبيان.",
  alternates: {
    canonical: `${baseUrl}/exchange-policy`,
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
    title: "سياسة الاستبدال | نوبيان Nubian",
    description: "سياسة الاستبدال لمتجر نوبيان - تعرف على شروط وإجراءات استبدال المنتجات في متجر نوبيان.",
    url: `${baseUrl}/exchange-policy`,
    type: "website",
  },
};

export default function ExchangePolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

