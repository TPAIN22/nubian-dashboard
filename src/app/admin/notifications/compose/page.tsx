'use client'

import { ComposeForm } from '@/features/notifications/components/ComposeForm'

export default function NotificationComposePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Compose</h2>
        <p className="text-sm text-muted-foreground">
          Send a one-off broadcast or a marketing campaign. Both routes go through the
          fanout queue when <code>ENABLE_QUEUE</code> is on.
        </p>
      </div>
      <ComposeForm />
    </div>
  )
}
