'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { axiosInstance } from '@/lib/axiosInstance'
import {
  Button,
  Field,
  FieldGrid,
  FormSection,
  Input,
  Textarea,
} from '@/components/admin'
import { SimpleImageUpload } from '@/components/simpleImageUpload'
import {
  collectionFormSchema,
  emptyCollection,
  toCollectionPayload,
  type CollectionFormValues,
} from '@/lib/collection'
import { CollectionProductsField } from './CollectionProductsField'

/* ============================================================================
   Collection form
   ----------------------------------------------------------------------------
   One component for create and edit — the only difference is the verb and the
   URL, and duplicating a form with an ordered product picker in it to express
   that would be two things to keep in sync.

   react-hook-form + zod + the admin Field primitives, same as every other write
   surface in this console.
   ========================================================================== */

export function CollectionForm({
  collectionId,
  initialValues,
}: {
  /** Absent = create. */
  collectionId?: string
  initialValues?: CollectionFormValues
}) {
  const router = useRouter()
  const { getToken } = useAuth()
  const isEditing = Boolean(collectionId)

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: initialValues ?? emptyCollection,
    mode: 'onChange',
  })

  const { errors, isSubmitting } = form.formState
  const products = form.watch('products')
  const image = form.watch('image')
  const isActive = form.watch('isActive')

  const onSubmit: SubmitHandler<CollectionFormValues> = async (values) => {
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const payload = toCollectionPayload(values)

      if (isEditing) {
        await axiosInstance.put(`/collections/${collectionId}`, payload, { headers })
        toast.success('تم تحديث المجموعة')
      } else {
        await axiosInstance.post('/collections', payload, { headers })
        toast.success('تم إنشاء المجموعة')
      }

      router.push('/admin/collections')
      router.refresh()
    } catch (e) {
      // axiosInstance surfaces the backend's standardised envelope as
      // `formattedMessage`; the raw fallbacks cover a non-enveloped failure.
      const err = e as {
        formattedMessage?: string
        response?: { data?: { error?: { message?: string }; message?: string } }
      }
      toast.error(isEditing ? 'فشل تحديث المجموعة' : 'فشل إنشاء المجموعة', {
        description:
          err.formattedMessage ??
          err.response?.data?.error?.message ??
          err.response?.data?.message ??
          'حدث خطأ غير معروف',
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection
        title="الأساسيات"
        description="الاسم والوصف اللذان يظهران في أعلى شاشة المجموعة داخل التطبيق."
      >
        <FieldGrid columns={1}>
          <Field label="اسم المجموعة" required error={errors.name?.message}>
            <Input {...form.register('name')} placeholder="مثال: مفضلات رمضان" />
          </Field>

          <Field
            label="الوصف"
            hint="اختياري — سطر أو سطران يشرحان ما الذي يجمع هذه المنتجات."
            error={errors.description?.message}
          >
            <Textarea {...form.register('description')} placeholder="وصف اختياري للمجموعة" />
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection
        title="الصورة"
        description="اختيارية. تظهر كغلاف للمجموعة، مثل صورة التصنيف تماماً."
      >
        <Field error={errors.image?.message}>
          <SimpleImageUpload
            value={image}
            onChange={(url) => form.setValue('image', url ?? '', { shouldValidate: true, shouldDirty: true })}
          />
        </Field>
      </FormSection>

      <FormSection
        title="المنتجات"
        description="ابحث وأضف المنتجات. الترتيب هنا هو ترتيب ظهورها للعملاء."
      >
        <CollectionProductsField
          value={products}
          disabled={isSubmitting}
          error={errors.products?.message ?? errors.products?.root?.message}
          onChange={(rows) =>
            form.setValue('products', rows, { shouldValidate: true, shouldDirty: true })
          }
        />
      </FormSection>

      <FormSection title="الظهور" description="متى تظهر المجموعة، وأين ترتيبها بين المجموعات.">
        <FieldGrid columns={2}>
          <Field
            label="الترتيب"
            hint="رقم أقل = ظهور أولاً."
            error={errors.sortOrder?.message}
          >
            <Input type="number" min={0} {...form.register('sortOrder', { valueAsNumber: true })} />
          </Field>

          <Field label="الحالة">
            <label className="flex h-8 items-center gap-2 text-[13px] text-foreground">
              <input
                type="checkbox"
                checked={isActive}
                disabled={isSubmitting}
                onChange={(e) =>
                  form.setValue('isActive', e.target.checked, { shouldDirty: true })
                }
                className="size-4"
              />
              المجموعة مفعّلة
            </label>
          </Field>
        </FieldGrid>
      </FormSection>

      <div className="flex gap-2 pt-5">
        <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isEditing ? 'حفظ التغييرات' : 'إنشاء المجموعة'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={isSubmitting}
          onClick={() => router.push('/admin/collections')}
        >
          إلغاء
        </Button>
      </div>
    </form>
  )
}
