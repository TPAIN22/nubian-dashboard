'use client'

import { PreferencesPanel } from '@/features/notifications/components/PreferencesPanel'

export default function NotificationPreferencesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Default channel, quiet-hour, rate-limit, and anti-spam configuration. Per-user
          overrides still live in each recipient&apos;s account.
        </p>
      </div>
      <PreferencesPanel />
    </div>
  )
}
