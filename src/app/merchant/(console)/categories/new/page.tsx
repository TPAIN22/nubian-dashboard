'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as z from 'zod'
import { toast } from 'sonner'

import {
  Alert,
  Button,
  Field,
  FormSection,
  Input,
  Page,
  PageBody,
  PageHeader,
  Select,
  StickyBar,
  Textarea,
} from '@/components/admin'
import { SimpleImageUpload } from '@/components/simpleImageUpload'
import { merchantRequest } from '@/features/merchant/api'

/* ============================================================================
   New category
   ----------------------------------------------------------------------------
   A shared taxonomy: whatever a merchant creates here becomes selectable for
   every merchant on the platform. The old page said so in a grey <span> with
   inline styles; it is now the first thing on the screen, because creating a
   near-duplicate of an existing category is the mistake this form invites.
   ========================================================================== */

const schema = z.object({
  name: z.string().min(1, 'اسم التصنيف مطلوب'),
  description: z.string().optional(),
  image: z.string().url('رابط الصورة غير صالح').optional().or(z.literal('')),
  parent: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Category = { _id: string; name: string; parent?: string }

export default function MerchantNewCategoryPage() {
  return (
    <React.Suspense fallback={null}>
      <NewCategoryView />
    </React.Suspense>
  )
}

function NewCategoryView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const backHref = searchParams.get('from') || '/merchant/products/new'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', image: '', parent: 'none' },
  })
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = form

  const parents = useQuery<Category[]>({
    queryKey: ['categories', 'parents'],
    queryFn: async () => {
      const body = await merchantRequest<any>('/api/categories')
      const list: Category[] = Array.isArray(body) ? body : (body?.data ?? [])
      return list.filter((c) => !c.parent)
    },
    staleTime: 5 * 60_000,
  })

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      merchantRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          parent: values.parent === 'none' || !values.parent ? null : values.parent,
        }),
      }),
    onSuccess: () => {
      toast.success('تم إنشاء التصنيف')
      router.push(backHref)
      router.refresh()
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر إنشاء التصنيف'),
  })

  const image = watch('image')

  return (
    <Page>
      <PageHeader
        backHref={backHref}
        title="تصنيف جديد"
        description="أضف تصنيفاً عندما لا تجد ما يناسب منتجك."
      />

      <PageBody variant="narrow">
        <Alert tone="warning" className="mb-5">
          التصنيفات مشتركة بين كل تجّار نُوبيان. تأكد أولاً من عدم وجود تصنيف مشابه قبل إنشاء واحد
          جديد.
        </Alert>

        <form onSubmit={handleSubmit((v) => create.mutate(v))} noValidate>
          <FormSection title="التصنيف" description="الاسم كما سيظهر للعملاء في التطبيق.">
            <Field label="اسم التصنيف" required error={errors.name?.message}>
              <Input placeholder="مثال: عطور" {...register('name')} />
            </Field>

            <Field
              label="الفئة الرئيسية"
              hint="اتركها «بدون» لإنشاء تصنيف رئيسي، أو اختر تصنيفاً لجعله فرعياً منه."
              error={errors.parent?.message}
            >
              <Select disabled={parents.isLoading} {...register('parent')}>
                <option value="none">بدون — تصنيف رئيسي</option>
                {(parents.data ?? []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="الوصف" error={errors.description?.message}>
              <Textarea rows={3} placeholder="وصف موجز للتصنيف" {...register('description')} />
            </Field>
          </FormSection>

          <FormSection title="الصورة" description="تظهر في شبكة التصنيفات داخل التطبيق.">
            <Field error={errors.image?.message}>
              <SimpleImageUpload
                value={image || ''}
                onChange={(url) => setValue('image', url ?? '', { shouldDirty: true })}
              />
            </Field>
          </FormSection>
        </form>
      </PageBody>

      <StickyBar
        visible={isDirty || create.isPending}
        status={create.isPending ? 'جارٍ الإنشاء…' : 'تصنيف جديد لم يُحفظ بعد'}
      >
        <Button variant="ghost" size="sm" onClick={() => router.push(backHref)}>
          إلغاء
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={create.isPending}
          onClick={handleSubmit((v) => create.mutate(v))}
        >
          إنشاء التصنيف
        </Button>
      </StickyBar>
    </Page>
  )
}
