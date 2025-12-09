import type { Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { dark } from '@clerk/themes'
import { Toaster } from '@/components/ui/sonner'


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: "نوبيان | Noubian - متجر نوبيان للتسوق",
  description: "نوبيان - Nubian، متجر إلكتروني يقدم منتجات متعددة من أفضل التجار. اكتشف أحدث المنتجات الآن.",
  keywords: ["نوبيان", "Nubian", "nubian sd", "nubian store", "nubian-sd.store", "nubian.com", "nubian-sd.com", "تسوق", "متجر إلكتروني"],
  openGraph: {
    title: "Noubian | نوبيان",
    description: "أفضل متجر إلكتروني في السودان.",
    url: "https://nubian-sd.store",
    siteName: "Nubian",
    locale: "ar" ,
    type: "website",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
     <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
           <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >       
            {children}
            <Toaster/>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}