'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import * as z from 'zod'
import { toast } from 'sonner'

import {
  Button,
  ErrorState,
  Field,
  FieldGrid,
  FormSection,
  Input,
  Page,
  PageBody,
  PageHeader,
  Skeleton,
  StickyBar,
  Textarea,
} from '@/components/admin'
import {
  merchantKeys,
  merchantRequest,
  useInvalidateMerchant,
  useMerchantProfile,
  useMerchantStatus,
} from '@/features/merchant/api'

/* ============================================================================
   Store settings
   ----------------------------------------------------------------------------
   A Shopify-style settings form: labelled sections down the page, a sticky
   save rail that only appears once something is dirty. The old version buried
   Save at the bottom of a card, so on a short viewport you had to scroll to
   find out whether you had already saved.
   ========================================================================== */

const schema = z.object({
  businessName: z.string().min(1, 'اسم المتجر مطلوب'),
  businessEmail: z.string().email('عنوان بريد إلكتروني غير صحيح'),
  businessPhone: z.string().optional(),
  businessDescription: z.string().optional(),
  businessAddress: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = {
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  businessDescription: '',
  businessAddress: '',
}

export default function MerchantSettingsPage() {
  const router = useRouter()
  const profile = useMerchantProfile()
  const status = useMerchantStatus()
  const invalidate = useInvalidateMerchant()

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form

  // A 404 means there is no merchant record yet — that user belongs in the
  // application flow, not in settings.
  React.useEffect(() => {
    if ((profile.error as { status?: number } | null)?.status === 404) {
      router.replace('/merchant/apply')
    }
  }, [profile.error, router])

  React.useEffect(() => {
    if (!profile.data) return
    reset({
      businessName: profile.data.businessName || profile.data.storeName || '',
      businessEmail: profile.data.businessEmail || '',
      businessPhone: profile.data.businessPhone || '',
      businessDescription: profile.data.businessDescription || '',
      businessAddress: profile.data.businessAddress || '',
    })
  }, [profile.data, reset])

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      merchantRequest('/api/merchant/profile', {
        method: 'PUT',
        body: JSON.stringify(values),
      }),
    onSuccess: async (_data, values) => {
      // Re-seed the form from what we just sent so `isDirty` clears and the
      // sticky bar retracts without waiting for the refetch to land.
      reset(values)
      await invalidate([merchantKeys.profile, merchantKeys.status])
      toast.success('تم حفظ التغييرات')
    },
    onError: (e: Error) => toast.error(e.message || 'تعذر حفظ التغييرات'),
  })

  const store = status.data?.application

  if (profile.isError && (profile.error as { status?: number })?.status !== 404) {
    return (
      <Page>
        <PageHeader title="إعدادات المتجر" />
        <PageBody>
          <ErrorState size="page" onRetry={() => profile.refetch()} />
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title="إعدادات المتجر" description="البيانات التي يراها عملاؤك وفريق نُوبيان." />

      <PageBody variant="narrow">
        {profile.isLoading ? (
          <FormSkeleton />
        ) : (
          <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
            <FormSection
              title="هوية المتجر"
              description="الاسم الذي يظهر للعملاء على صفحة متجرك وفي كل طلب."
            >
              <Field label="اسم المتجر" required error={errors.businessName?.message}>
                <Input placeholder="مثال: متجر النيل" {...register('businessName')} />
              </Field>

              <Field
                label="وصف المتجر"
                hint="سطران عمّا تبيعه. يظهر أعلى صفحة متجرك."
                error={errors.businessDescription?.message}
              >
                <Textarea
                  rows={4}
                  placeholder="أخبر عملاءك عن متجرك…"
                  {...register('businessDescription')}
                />
              </Field>
            </FormSection>

            <FormSection
              title="بيانات التواصل"
              description="نستخدمها للتواصل معك بشأن الطلبات والمدفوعات."
            >
              <FieldGrid>
                <Field label="البريد الإلكتروني" required error={errors.businessEmail?.message}>
                  <Input
                    type="email"
                    dir="ltr"
                    placeholder="business@example.com"
                    {...register('businessEmail')}
                  />
                </Field>
                <Field label="رقم الهاتف" error={errors.businessPhone?.message}>
                  <Input
                    type="tel"
                    dir="ltr"
                    placeholder="+249123456789"
                    {...register('businessPhone')}
                  />
                </Field>
              </FieldGrid>

              <Field label="العنوان" error={errors.businessAddress?.message}>
                <Textarea
                  rows={2}
                  placeholder="عنوان المتجر أو المستودع"
                  {...register('businessAddress')}
                />
              </Field>
            </FormSection>

            {store && (
              <FormSection
                title="حالة الحساب"
                description="تُدار من قبل فريق نُوبيان ولا يمكن تعديلها من هنا."
              >
                <dl className="rounded-lg border border-border bg-canvas px-3.5 py-1">
                  <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
                    <dt className="text-[12px] text-text-muted">حالة المتجر</dt>
                    <dd className="text-[12px] font-medium text-foreground">
                      {store.status?.toUpperCase() === 'APPROVED' ? 'معتمد' : store.status}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
                    <dt className="text-[12px] text-text-muted">تاريخ الانضمام</dt>
                    <dd className="text-[12px] font-medium text-foreground nums">
                      {store.createdAt
                        ? new Date(store.createdAt).toLocaleDateString('en-CA')
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </FormSection>
            )}
          </form>
        )}
      </PageBody>

      <StickyBar
        visible={isDirty || save.isPending}
        status={save.isPending ? 'جارٍ الحفظ…' : 'لديك تغييرات غير محفوظة'}
      >
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={save.isPending}
          onClick={() => reset()}
        >
          تجاهل
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={save.isPending}
          onClick={handleSubmit((v) => save.mutate(v))}
        >
          حفظ التغييرات
        </Button>
      </StickyBar>
    </Page>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-8 py-2">
      {[0, 1].map((section) => (
        <div key={section} className="grid gap-x-10 gap-y-4 lg:grid-cols-[minmax(180px,240px)_1fr]">
          <div>
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-2 h-2.5 w-40" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
