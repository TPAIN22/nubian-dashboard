import { AdminShell } from '@/components/admin/shell/admin-shell'

/**
 * The `admin-theme` class is the boundary for the admin design system
 * (src/styles/admin.css). Everything inside it gets the dense, ink-primary
 * token set; the marketing site outside keeps the legacy gold/glass theme.
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="admin-theme">
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
