import type { Metadata } from "next";

const baseUrl = "https://nubian-sd.store";

export const metadata: Metadata = {
  title: "عن نوبيان | About Nubian - متجر نوبيان للتسوق الإلكتروني",
  description:
    "تعرف على نوبيان - متجر إلكتروني رائد في السودان. اكتشف رؤيتنا، مهمتنا، وقيمنا في تقديم أفضل تجربة تسوق إلكتروني.",
  alternates: {
    canonical: `${baseUrl}/about`,
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
    title: "عن نوبيان | About Nubian - متجر نوبيان للتسوق الإلكتروني",
    description:
      "تعرف على نوبيان - متجر إلكتروني رائد في السودان. اكتشف رؤيتنا، مهمتنا، وقيمنا في تقديم أفضل تجربة تسوق إلكتروني.",
    url: `${baseUrl}/about`,
    type: "website",
    siteName: "نوبيان | Nubian",
    images: [
      {
        url: `${baseUrl}/nubi.png`,
        width: 1200,
        height: 630,
        alt: "عن نوبيان | About Nubian",
      },
    ],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}




