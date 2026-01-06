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
import { validateEnv } from "@/lib/envValidator"
import logger from "@/lib/logger"
import { ClerkDiagnostics } from "@/components/ClerkDiagnostics"
import { ClerkKeyChecker } from "@/components/ClerkKeyChecker"
import { ClerkNetworkChecker } from "@/components/ClerkNetworkChecker"

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
    logger.warn('Environment validation warning', { error: error instanceof Error ? error.message : String(error) });
  }
}


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const baseUrl = "https://nubian-sd.store";

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
    "nubian-sd.store", 
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
    languages: {
      'ar': baseUrl,
      'en': baseUrl,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
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
    creator: "@nubian",
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
    // Add your verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
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
  
  if (!isKeyValid) {
    if (typeof window === 'undefined') {
      // Server-side: Log error in production, warn in development
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ CRITICAL: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or invalid in production!')
        console.error('Variable value:', clerkPublishableKey ? `"${clerkPublishableKey.substring(0, 10)}..."` : 'undefined')
        console.error('This variable MUST be set during the build process in your deployment platform.')
        console.error('For Vercel: Set it in Project Settings > Environment Variables')
        console.error('For other platforms: Ensure it is available during "next build" command')
        console.error('After setting, you MUST trigger a new build/deployment for it to take effect.')
      } else {
        console.warn('⚠️ Clerk Warning: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Authentication will not work.')
        console.warn('Set this variable in your .env.local file for local development.')
      }
    }
    
    // In production, we should still try to render but Clerk won't work
    // This prevents the entire app from breaking
  } else {
    if (typeof window === 'undefined') {
      console.log('✅ Clerk publishable key is configured')
    }
  }

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
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <head>
          {/* Capture Clerk initialization errors */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Capture errors before Clerk loads
                  window.__CLERK_ERRORS__ = [];
                  const originalError = console.error;
                  console.error = function(...args) {
                    if (args.some(arg => typeof arg === 'string' && arg.includes('Clerk'))) {
                      window.__CLERK_ERRORS__.push(args.join(' '));
                    }
                    originalError.apply(console, args);
                  };
                  
                  // Also listen for unhandled errors
                  window.addEventListener('error', function(e) {
                    if (e.message && e.message.includes('Clerk')) {
                      window.__CLERK_ERRORS__.push(e.message);
                    }
                  });
                })();
              `,
            }}
          />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ErrorBoundary>
          <StructuredData />
           <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >       
            {children}
            <Toaster/>
            <ClerkKeyChecker />
            <ClerkNetworkChecker />
            <ClerkDiagnostics />
          </ThemeProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}