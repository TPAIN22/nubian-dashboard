'use client'

import { Page, PageBody, PageHeader, Section } from '@/components/admin'
import { CollectionForm } from '../CollectionForm'

export default function NewCollectionPage() {
  return (
    <Page>
      <PageHeader
        title="مجموعة جديدة"
        description="اختر المنتجات ورتّبها — نفس الترتيب سيظهر للعملاء."
        backHref="/admin/collections"
      />
      <PageBody>
        <Section variant="panel">
          <CollectionForm />
        </Section>
      </PageBody>
    </Page>
  )
}
