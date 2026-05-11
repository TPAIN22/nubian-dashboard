import type { Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { dark } from '@clerk/themes'
import { Toaster } from '@/components/ui/sonner'
import StructuredData from "@/components/StructuredData"
import ErrorBoundary from "@/components/ErrorBoundary"
import QueryProvider from "@/components/QueryProvider"
import { validateEnv } from "@/lib/envValidator"

// Validate environment variables at runtime (not during build)
// The validateEnv function now handles build-time detection internally
// It will skip validation during build and only validate when serving requests
if (typeof window === 'undefined') {
  try {
    validateEnv({ throwOnError: true, skipBuildTime: true });
  } catch (error) {
    // If validation fails at runtime (not during build), throw to fail fast
    // This ensures the app doesn't start with missing critical environment variables
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}


import { Outfit, Inter, IBM_Plex_Sans_Arabic } from 'next/font/google'

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-outfit',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
})

const baseUrl = "https://nubian-sd.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "نوبيان | Nubian - متجر نوبيان للتسوق الإلكتروني في السودان",
    template: "%s | نوبيان Nubian"
  },
  description: "نوبيان (Nubian) - أفضل متجر إلكتروني في السودان. تسوق آلاف المنتجات الأصلية من الأزياء والإلكترونيات والديكور. شحن سريع وآمن إلى جميع أنحاء السودان. اكتشف نوبيان الآن!",
  keywords: [
    "نوبيان", 
    "Nubian", 
    "نوبيان سودان", 
    "Nubian Sudan",
    "nubian sd", 
    "nubian store", 
    "nubian-sd.com", 
    "nubian.com", 
    "nubian-sd.com",
    "متجر نوبيان",
    "نوبيان للتسوق",
    "تسوق إلكتروني السودان",
    "متجر إلكتروني السودان",
    "تسوق أونلاين السودان",
    "منتجات سودانية",
    "تسوق السودان",
    "shopping Sudan",
    "online store Sudan",
    "ecommerce Sudan"
  ],
  authors: [{ name: "Nubian" }],
  creator: "Nubian",
  publisher: "Nubian",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      'ar-SD': baseUrl,
      'x-default': baseUrl,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_SD",
    alternateLocale: ["ar_SA", "ar_EG", "en_US"],
    url: baseUrl,
    siteName: "نوبيان | Nubian",
    title: "نوبيان | Nubian - متجر نوبيان للتسوق الإلكتروني في السودان",
    description: "نوبيان (Nubian) - أفضل متجر إلكتروني في السودان. تسوق آلاف المنتجات الأصلية مع شحن سريع وآمن إلى جميع أنحاء السودان.",
    images: [
      {
        url: `${baseUrl}/nubi.png`,
        width: 1200,
        height: 630,
        alt: "نوبيان | Nubian - متجر إلكتروني",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "نوبيان | Nubian - متجر نوبيان للتسوق الإلكتروني",
    description: "نوبيان (Nubian) - أفضل متجر إلكتروني في السودان. تسوق آلاف المنتجات الأصلية.",
    images: [`${baseUrl}/nubi.png`],
    site: "@nubian_sd",
    creator: "@nubian_sd",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  category: "ecommerce",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get Clerk publishable key from environment
  // IMPORTANT: NEXT_PUBLIC_ variables must be set at BUILD TIME in Next.js
  // They are embedded into the client bundle during build, not at runtime
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  // Validate Clerk key is present and valid
  const isKeyValid = clerkPublishableKey && 
    clerkPublishableKey.trim() !== '' && 
    !clerkPublishableKey.includes('your_key') &&
    clerkPublishableKey.startsWith('pk_')

  // ClerkProvider requires a valid publishableKey
  // According to Clerk docs: https://clerk.com/docs
  // The publishableKey must be set at build time for NEXT_PUBLIC_ variables
  // If it's missing, Clerk SDK won't load properly
  return (
     <ClerkProvider
      publishableKey={isKeyValid ? clerkPublishableKey : undefined}
      appearance={{
        baseTheme: dark,
      }}
      // Add redirect URLs for better handling
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="ar" dir="rtl" suppressHydrationWarning className="overflow-x-clip">
        <head>
        </head>
        <body className={`${outfit.variable} ${inter.variable} ${ibmPlexArabic.variable} antialiased`}>
          <QueryProvider>
            <ErrorBoundary>
              <StructuredData />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </ErrorBoundary>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
