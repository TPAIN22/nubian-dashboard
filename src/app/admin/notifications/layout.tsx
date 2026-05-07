import type { ReactNode } from 'react'

import { NotificationsSubNav } from '@/features/notifications/components/SubNav'

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4 sm:p-6 md:p-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Notification center
        </h1>
        <p className="text-sm text-muted-foreground">
          Compose, monitor, and operate every notification surface — push, email, in-app,
          and broadcast pipelines.
        </p>
      </header>
      <NotificationsSubNav />
      <div className="flex-1">{children}</div>
    </div>
  )
}
