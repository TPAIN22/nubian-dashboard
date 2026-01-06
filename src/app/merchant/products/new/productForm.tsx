'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { axiosInstance } from '@/lib/axiosInstance'
import logger from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ImageUpload from '@/components/imageUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  discountPrice: z.number().min(0).optional(),
  category: z.string().min(1, 'Category is required'),
  stock: z.number().min(0, 'Stock cannot be negative'),
  sizes: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  isActive: z.boolean().optional(),
})

interface Category {
  _id: string
  name: string
}

export function MerchantProductForm({ productId }: { productId?: string }) {
  const router = useRouter()
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(!!productId)
  const [merchantStatus, setMerchantStatus] = useState<'checking' | 'approved' | 'not-approved'>('checking')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      discountPrice: undefined,
      category: '',
      stock: 0,
      sizes: [],
      images: [],
      isActive: true,
    },
  })

  useEffect(() => {
    const checkMerchantStatus = async () => {
      if (!isLoaded || !user) {
        setMerchantStatus('not-approved')
        return
      }

      // Check if user has merchant role
      const role = user.publicMetadata?.role as string | undefined
      if (role !== 'merchant') {
        setMerchantStatus('not-approved')
        return
      }

      try {
        const token = await getToken()
        if (!token) {
          setMerchantStatus('not-approved')
          return
        }

        const response = await axiosInstance.get('/merchants/my-status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.data.hasApplication && response.data.merchant?.status === 'APPROVED') {
          setMerchantStatus('approved')
        } else {
          setMerchantStatus('not-approved')
        }
      } catch (error) {
        logger.error('Failed to check merchant status', { error: error instanceof Error ? error.message : String(error) })
        setMerchantStatus('not-approved')
      }
    }

    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/categories')
        setCategories(res.data || [])
      } catch (error) {
        logger.error('Failed to fetch categories', { error: error instanceof Error ? error.message : String(error) })
        toast.error('فشل تحميل الفئات')
      }
    }

    checkMerchantStatus()
    fetchCategories()

    if (productId) {
      const fetchProduct = async () => {
        try {
          const token = await getToken()
          if (!token) {
            toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
            router.push('/sign-in')
            return
          }

          const res = await axiosInstance.get(`/products/${productId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          const product = res.data
          form.reset({
            name: product.name,
            description: product.description || '',
            price: product.price,
            discountPrice: product.discountPrice || undefined,
            category: product.category?._id || product.category || '',
            stock: product.stock,
            sizes: product.sizes || [],
            images: product.images || [],
            isActive: product.isActive !== false,
          })
        } catch (error) {
          logger.error('Failed to fetch product', { error: error instanceof Error ? error.message : String(error) })
          toast.error('فشل تحميل المنتج')
        }
      }
      fetchProduct()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isLoaded, user])

  const handleUploadDone = useCallback((urls: string[]) => {
    form.setValue('images', urls, { shouldValidate: true })
  }, [form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.images || values.images.length < 1) {
      toast.error('يرجى رفع صورة واحدة على الأقل')
      return
    }

    setLoading(true)
    try {
      // Get authentication token
      const token = await getToken()
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        router.push('/sign-in')
        return
      }

      const dataToSend = {
        ...values,
        discountPrice: values.discountPrice || 0,
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      if (isEdit && productId) {
        await axiosInstance.put(`/products/${productId}`, dataToSend, { headers })
        toast.success('تم تحديث المنتج بنجاح')
      } else {
        await axiosInstance.post('/products', dataToSend, { headers })
        toast.success('تم إنشاء المنتج بنجاح')
      }

      router.push('/merchant/products')
    } catch (error: any) {
      logger.error('Error saving product', { 
        error: error instanceof Error ? error.message : String(error),
        status: error.response?.status 
      })
      
      // More specific error messages
      if (error.response?.status === 401) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        router.push('/sign-in')
      } else if (error.response?.status === 403) {
        toast.error('ليس لديك صلاحية لإضافة منتجات. يرجى التأكد من أن حسابك معتمد.')
      } else {
        toast.error(error.response?.data?.message || 'فشل حفظ المنتج')
      }
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking merchant status
  if (merchantStatus === 'checking') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-lg">جاري التحقق من حالة التاجر...</div>
        </CardContent>
      </Card>
    )
  }

  // Show error if merchant is not approved
  if (merchantStatus === 'not-approved') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>غير مصرح لك بإضافة منتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              يجب أن يكون حسابك معتمداً كتاجر قبل إضافة المنتجات. يرجى التحقق من حالة طلبك.
            </p>
            <Button onClick={() => router.push('/merchant/apply')}>
              التحقق من حالة الطلب
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'تعديل المنتج' : 'إنشاء منتج'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المنتج *</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم المنتج" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل وصف المنتج"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر الأصلي (اختياري)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفئة *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر فئة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المخزون *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Label className="mb-2 block">صور المنتج *</Label>
              <ImageUpload onUploadComplete={handleUploadDone} />
              {form.formState.errors.images && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {form.formState.errors.images.message}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الحفظ...' : isEdit ? 'تحديث المنتج' : 'إنشاء المنتج'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/merchant/products')}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

