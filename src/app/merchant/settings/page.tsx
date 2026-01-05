'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { axiosInstance } from '@/lib/axiosInstance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import logger from '@/lib/logger'

const formSchema = z.object({
  businessName: z.string().min(1, 'اسم العمل مطلوب'),
  businessDescription: z.string().optional(),
  businessEmail: z.string().email('عنوان بريد إلكتروني غير صحيح'),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
})

export default function MerchantSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: '',
      businessDescription: '',
      businessEmail: '',
      businessPhone: '',
      businessAddress: '',
    },
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/merchants/my-profile')
        const merchant = response.data
        form.reset({
          businessName: merchant.businessName || '',
          businessDescription: merchant.businessDescription || '',
          businessEmail: merchant.businessEmail || '',
          businessPhone: merchant.businessPhone || '',
          businessAddress: merchant.businessAddress || '',
        })
      } catch (error: any) {
        logger.error('Error fetching profile', { 
          error: error instanceof Error ? error.message : String(error),
          status: error.response?.status 
        })
        if (error.response?.status === 404) {
          router.push('/merchant/apply')
          return
        }
        toast.error('فشل تحميل الملف الشخصي')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [form, router])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true)
    try {
      await axiosInstance.put('/merchants/my-profile', values)
      toast.success('تم تحديث الملف الشخصي بنجاح')
    } catch (error: any) {
      logger.error('Error updating profile', { 
        error: error instanceof Error ? error.message : String(error),
        status: error.response?.status 
      })
      toast.error(error.response?.data?.message || 'فشل تحديث الملف الشخصي')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
      <h1 className="text-2xl font-bold">إعدادات المتجر</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>معلومات العمل</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم العمل *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم العمل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني للعمل *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="business@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>هاتف العمل</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+249123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف العمل</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="أخبرنا عن عملك..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان العمل</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="أدخل عنوان عملك"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

