import type { Metadata } from 'next';

const baseUrl = "https://nubian-sd.store";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | نوبيان Nubian",
  description: "سياسة الخصوصية لمتجر نوبيان - تعرف على كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية.",
  alternates: {
    canonical: `${baseUrl}/privacy-policy`,
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
    title: "سياسة الخصوصية | نوبيان Nubian",
    description: "سياسة الخصوصية لمتجر نوبيان - تعرف على كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية.",
    url: `${baseUrl}/privacy-policy`,
    type: "website",
    siteName: "نوبيان | Nubian",
    images: [
      {
        url: `${baseUrl}/nubi.png`,
        width: 1200,
        height: 630,
        alt: "سياسة الخصوصية | Privacy Policy",
      },
    ],
  },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

