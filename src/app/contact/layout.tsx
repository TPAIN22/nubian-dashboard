import type { Metadata } from 'next';

const baseUrl = "https://nubian-sd.store";

export const metadata: Metadata = {
  title: "اتصل بنا | Contact Us - نوبيان Nubian",
  description: "تواصل مع متجر نوبيان - نحن هنا لمساعدتك. اتصل بنا عبر البريد الإلكتروني، الهاتف، أو أرسل لنا رسالة مباشرة.",
  alternates: {
    canonical: `${baseUrl}/contact`,
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
    title: "اتصل بنا | Contact Us - نوبيان Nubian",
    description: "تواصل مع متجر نوبيان - نحن هنا لمساعدتك. اتصل بنا عبر البريد الإلكتروني، الهاتف، أو أرسل لنا رسالة مباشرة.",
    url: `${baseUrl}/contact`,
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

