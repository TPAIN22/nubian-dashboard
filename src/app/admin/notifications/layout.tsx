import type { ReactNode } from 'react'

import { Page, PageBody, PageHeader } from '@/components/admin'
import { NotificationsSubNav } from '@/features/notifications/components/SubNav'

/**
 * The notification centre owns one header for all five sub-pages; each child
 * renders only its own content into `PageBody`.
 */
export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return (
    <Page>
      <PageHeader
        title="مركز الإشعارات"
        description="إنشاء ومتابعة وتشغيل كل قنوات الإشعارات — الدفع، البريد، داخل التطبيق والبث الجماعي."
        tabs={<NotificationsSubNav />}
      />
      <PageBody>{children}</PageBody>
    </Page>
  )
}
