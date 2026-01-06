import Side from '@/components/ui/side-bar-provider'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Note: ClerkProvider, ThemeProvider, Toaster, etc. are provided by root layout
  // This nested layout only adds the sidebar wrapper for admin routes
  return (
    <Side>
      {children}
    </Side>
  )
}