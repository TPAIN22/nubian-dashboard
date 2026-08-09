'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import * as z from 'zod'
import { toast } from 'sonner'

import {
  Alert,
  Button,
  DetailRow,
  ErrorState,
  Field,
  FieldGrid,
  FormSection,
  ImageUploadField,
  Input,
  Page,
  PageBody,
  PageHeader,
  Skeleton,
  StatusBadge,
  StickyBar,
  Textarea,
} from '@/components/admin'
import {
  ROLE_LABELS,
  STORE_PERMISSIONS,
  merchantKeys,
  merchantRequest,
  useInvalidateMerchant,
  useMerchantProfile,
  useMerchantStatus,
  useStorePermissions,
} from '@/features/merchant/api'

/* ============================================================================
   Store settings
   ----------------------------------------------------------------------------
   A Shopify-style settings form: labelled sections down the page, a sticky
   save rail that only appears once something is dirty. The old version buried
   Save at the bottom of a card, so on a short viewport you had to scroll to
   find out whether you had already saved.

   Who a store *is* belongs to whoever owns it. `PUT /merchants/my-profile` is
   gated on `profile:write`, which only the owner holds, so for a manager or a
   member of staff this screen is a read-only view of their shop: the controls
   render disabled and the save rail never appears. Before this, they got the
   full form and a 403 on save.
   ========================================================================== */

/**
 * Field names are the API's, not the form's. `PUT /merchants/my-profile` reads
 * `storeName, description, email, phone, city, logoUrl, banner` off the body and
 * silently drops anything else — the previous `business*` names meant every save
 * returned 200 having written nothing, and every field but the name loaded blank.
 */
const schema = z.object({
  storeName: z.string().min(1, 'اسم المتجر مطلوب'),
  email: z.string().email('عنوان بريد إلكتروني غير صحيح'),
  phone: z.string().optional(),
  description: z.string().optional(),
  city: z.string().optional(),
  // Empty string is a real value, not a missing one: it is how the merchant
  // clears an existing image, and the API applies any key that is present.
  logoUrl: z.string().optional(),
  banner: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = {
  storeName: '',
  email: '',
  phone: '',
  description: '',
  city: '',
  logoUrl: '',
  banner: '',
}

export default function MerchantSettingsPage() {
  const router = useRouter()
  const profile = useMerchantProfile()
  const status = useMerchantStatus()
  const invalidate = useInvalidateMerchant()
  const perms = useStorePermissions()

  // Until the answer is in, assume no — rendering an editable form and then
  // locking it a moment later is worse than a beat of read-only. If the lookup
  // *failed*, though, fall open: the backend rejects a save without
  // `profile:write` anyway, and an owner shut out of their own settings by an
  // unrelated timeout has no way forward.
  const canEdit = perms.can(STORE_PERMISSIONS.PROFILE_WRITE) || perms.isUnknown
  const readOnly = !canEdit

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = form

  const logoUrl = watch('logoUrl')
  const banner = watch('banner')

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
      storeName: profile.data.storeName || '',
      email: profile.data.email || '',
      phone: profile.data.phone || '',
      description: profile.data.description || '',
      city: profile.data.city || '',
      logoUrl: profile.data.logoUrl || '',
      banner: profile.data.banner || '',
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

  // Disabled inputs still leave Enter-to-submit on the form itself, so the
  // permission is checked here too rather than only on the controls.
  const submit = (values: FormValues) => {
    if (!canEdit) return
    save.mutate(values)
  }

  const store = status.data?.application

  if (profile.isError && (profile.error as { status?: number })?.status !== 404) {
    return (
      <Page>
        <PageHeader title="إعدادات المتجر" />
        <PageBody>
          <ErrorState
            size="page"
            description={(profile.error as Error)?.message}
            onRetry={() => profile.refetch()}
          />
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title="إعدادات المتجر" description="البيانات التي يراها عملاؤك وفريق نُوبيان." />

      <PageBody variant="narrow">
        {profile.isLoading || perms.isLoading ? (
          <FormSkeleton />
        ) : (
          <form onSubmit={handleSubmit(submit)} noValidate>
            {readOnly && (
              <Alert tone="neutral" className="mb-5">
                هذه بيانات متجرك للاطلاع فقط. تعديل هوية المتجر وبيانات التواصل متاح لمالك المتجر
                وحده.
              </Alert>
            )}

            <FormSection
              title="هوية المتجر"
              description="الاسم الذي يظهر للعملاء على صفحة متجرك وفي كل طلب."
            >
              <Field label="اسم المتجر" required error={errors.storeName?.message}>
                <Input
                  placeholder="مثال: متجر النيل"
                  {...register('storeName')}
                  disabled={readOnly}
                />
              </Field>

              <Field
                label="وصف المتجر"
                hint="سطران عمّا تبيعه. يظهر أعلى صفحة متجرك."
                error={errors.description?.message}
              >
                <Textarea
                  rows={4}
                  placeholder="أخبر عملاءك عن متجرك…"
                  {...register('description')}
                  disabled={readOnly}
                />
              </Field>
            </FormSection>

            <FormSection
              title="صور المتجر"
              description="الشعار والغلاف كما يظهران في أعلى صفحة متجرك داخل التطبيق."
            >
              <Field
                label="شعار المتجر"
                hint="اختياري — صورة مربعة. يظهر بجانب اسم متجرك وفي قائمة المتاجر."
                error={errors.logoUrl?.message}
              >
                <ImageUploadField
                  value={logoUrl}
                  // `shouldDirty` is what raises the sticky save bar — without it
                  // an upload would look saved while nothing had been sent.
                  onChange={(url) => setValue('logoUrl', url, { shouldDirty: true })}
                  aspect="square"
                  folder="/merchant-logos/"
                  // A read-only viewer with no logo should be told there isn't
                  // one, not invited to drop a file onto a dead control.
                  placeholder={readOnly ? 'لا يوجد شعار' : 'اسحب الشعار هنا أو اضغط للاختيار'}
                  disabled={readOnly}
                />
              </Field>

              <Field
                label="صورة الغلاف"
                hint="اختياري — مقاس 16:9 (يفضّل 1600×900). إن تركتها فارغة يعرض التطبيق غلافاً تلقائياً مستمداً من شعارك."
                error={errors.banner?.message}
              >
                <ImageUploadField
                  value={banner}
                  onChange={(url) => setValue('banner', url, { shouldDirty: true })}
                  folder="/store-banners/"
                  placeholder={
                    readOnly ? 'لا توجد صورة غلاف' : 'اسحب صورة الغلاف هنا أو اضغط للاختيار'
                  }
                  disabled={readOnly}
                />
              </Field>
            </FormSection>

            <FormSection
              title="بيانات التواصل"
              description="نستخدمها للتواصل معك بشأن الطلبات والمدفوعات."
            >
              <FieldGrid>
                <Field label="البريد الإلكتروني" required error={errors.email?.message}>
                  <Input
                    type="email"
                    dir="ltr"
                    placeholder="business@example.com"
                    {...register('email')}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="رقم الهاتف" error={errors.phone?.message}>
                  <Input
                    type="tel"
                    dir="ltr"
                    placeholder="+249123456789"
                    {...register('phone')}
                    disabled={readOnly}
                  />
                </Field>
              </FieldGrid>

              {/* The Merchant model stores `city`, not a free-text address — the
                  old address textarea had nowhere to be saved. */}
              <Field label="المدينة" error={errors.city?.message}>
                <Input placeholder="مثال: جدة" {...register('city')} disabled={readOnly} />
              </Field>
            </FormSection>

            {store && (
              <FormSection
                title="حالة الحساب"
                description="تُدار من قبل فريق نُوبيان ولا يمكن تعديلها من هنا."
              >
                {/* DetailRow + StatusBadge rather than a hand-built table: a
                    store's status should read the same here as it does on the
                    admin's view of the same store. */}
                <dl className="divide-y divide-border rounded-lg border border-border bg-canvas px-3.5 py-1">
                  <DetailRow label="حالة المتجر" className="py-2.5">
                    <StatusBadge
                      status={store.status}
                      label={
                        store.status?.toUpperCase() === 'APPROVED' ? 'معتمد' : store.status
                      }
                    />
                  </DetailRow>
                  <DetailRow label="تاريخ الانضمام" className="py-2.5">
                    {store.createdAt
                      ? new Date(store.createdAt).toLocaleDateString('en-CA')
                      : '—'}
                  </DetailRow>
                  {perms.role && (
                    <DetailRow label="دورك في المتجر" className="py-2.5">
                      {ROLE_LABELS[perms.role]}
                    </DetailRow>
                  )}
                </dl>
              </FormSection>
            )}
          </form>
        )}
      </PageBody>

      <StickyBar
        visible={canEdit && (isDirty || save.isPending)}
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
          onClick={handleSubmit(submit)}
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
