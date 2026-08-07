'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

import { axiosInstance } from '@/lib/axiosInstance'
import {
  ErrorState,
  ListSkeleton,
  Page,
  PageBody,
  PageHeader,
  Section,
} from '@/components/admin'
import type { CollectionFormValues, CollectionProductRow } from '@/lib/collection'
import { CollectionForm } from '../../CollectionForm'

/**
 * Edit an existing collection.
 *
 * Reads `/collections/admin/:id`, which — unlike the public detail endpoint —
 * returns the curated products in stored order *including* ones that are hidden
 * or deleted, each flagged. The form has to show exactly what is stored: a row
 * silently dropped here would be silently dropped on save.
 */
export default function EditCollectionPage() {
  const { id } = useParams<{ id: string }>()
  const { getToken } = useAuth()

  const [values, setValues] = React.useState<CollectionFormValues | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const token = await getToken()
        const res = await axiosInstance.get(`/collections/admin/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = res.data?.data ?? res.data
        if (cancelled) return

        setValues({
          name: data.name ?? '',
          description: data.description ?? '',
          image: data.image ?? '',
          products: (data.products ?? []) as CollectionProductRow[],
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
        })
      } catch (e) {
        if (cancelled) return
        const err = e as { formattedMessage?: string; message?: string }
        setError(err.formattedMessage || err.message || 'تعذّر تحميل المجموعة')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, getToken])

  return (
    <Page>
      <PageHeader
        title={values?.name || 'تعديل المجموعة'}
        description="غيّر الاسم أو الصورة أو المنتجات وترتيبها."
        backHref="/admin/collections"
      />
      <PageBody>
        <Section variant="panel">
          {error ? (
            <ErrorState description={error} />
          ) : values ? (
            // Keyed on the id so navigating between collections remounts the
            // form rather than leaving react-hook-form on stale defaults.
            <CollectionForm key={id} collectionId={id} initialValues={values} />
          ) : (
            <ListSkeleton rows={5} />
          )}
        </Section>
      </PageBody>
    </Page>
  )
}
