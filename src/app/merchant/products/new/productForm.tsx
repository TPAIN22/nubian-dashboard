'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { AttributeDefinitionManager } from '@/components/product/AttributeDefinitionManager'
import { VariantManager } from '@/components/product/VariantManager'
import { ProductAttribute, ProductVariant } from '@/types/product.types'

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'), // Model requires description
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  
  // Product type: 'simple' or 'with_variants'
  productType: z.enum(['simple', 'with_variants']),
  
  // For simple products
  price: z.number().min(0.01, 'Price must be greater than 0').optional(),
  discountPrice: z.number().min(0, 'Discount price cannot be negative').optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  
  // For variant-based products
  attributes: z.array(z.object({
    name: z.string().min(1),
    displayName: z.string().min(1),
    type: z.enum(['select', 'text', 'number']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).optional(),
  
  variants: z.array(z.object({
    sku: z.string().min(1),
    attributes: z.record(z.string()),
    price: z.number().min(0.01),
    discountPrice: z.number().min(0).optional(),
    stock: z.number().int().min(0),
    images: z.array(z.string()).optional(),
    isActive: z.boolean(),
  })).optional(),
  
  // Legacy fields (for backward compatibility)
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  
  isActive: z.boolean().optional(),
}).refine((data) => {
  // If simple product, price and stock are required
  if (data.productType === 'simple') {
    return data.price !== undefined && 
           data.price !== null && 
           data.price >= 0.01 &&
           data.stock !== undefined && 
           data.stock !== null &&
           data.stock >= 0
  }
  // If variant product, attributes and variants are required
  if (data.productType === 'with_variants') {
    return data.attributes !== undefined && 
           Array.isArray(data.attributes) &&
           data.attributes.length > 0 &&
           data.variants !== undefined &&
           Array.isArray(data.variants) &&
           data.variants.length > 0
  }
  return true
}, {
  message: 'Invalid product configuration. For simple products, price (>= 0.01) and stock (>= 0) are required. For variant products, at least one attribute and one variant are required.',
  path: ['productType']
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
  const isSubmittingRef = useRef(false) // Prevent double submission

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Validate on change to show errors immediately
    defaultValues: {
      name: '',
      description: '',
      productType: 'simple',
      price: undefined, // Changed from 0 to undefined so validation can properly detect it's missing
      discountPrice: undefined,
      category: '',
      stock: undefined, // Changed from 0 to undefined so validation can properly detect it's missing
      attributes: [],
      variants: [],
      sizes: [],
      colors: [],
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
          const hasVariants = product.variants && product.variants.length > 0
          form.reset({
            name: product.name,
            description: product.description || '',
            productType: hasVariants ? 'with_variants' : 'simple',
            price: product.price,
            discountPrice: product.discountPrice || undefined,
            category: product.category?._id || product.category || '',
            stock: product.stock,
            attributes: product.attributes || [],
            variants: product.variants ? product.variants.map((v: any) => ({
              ...v,
              attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : v.attributes,
              isActive: v.isActive !== false, // Ensure boolean, default to true
            })) : [],
            sizes: product.sizes || [],
            colors: product.colors || [],
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
    // Ensure all URLs are valid strings (absolute URLs)
    const validUrls = urls.filter((url: string) => 
      url && 
      typeof url === 'string' && 
      url.trim().length > 0 && 
      (url.startsWith('http://') || url.startsWith('https://'))
    )
    
    logger.info('ImageUpload callback received URLs', {
      urlsCount: urls.length,
      validUrlsCount: validUrls.length,
      urls: urls,
      validUrls: validUrls,
    })
    
    // Always set images, even if empty array (to clear previous state)
    form.setValue('images', validUrls, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
    
    // Verify it was set correctly
    const currentImages = form.getValues('images')
    console.log('Form images after setValue:', {
      setValueCalled: true,
      currentImages: currentImages,
      currentImagesLength: currentImages?.length || 0,
      matchesValidUrls: JSON.stringify(currentImages) === JSON.stringify(validUrls),
    })
  }, [form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Prevent double submission
    if (isSubmittingRef.current || loading) {
      logger.warn('Form submission blocked - already submitting', {
        isSubmitting: isSubmittingRef.current,
        loading,
      })
      return
    }

    // Mark as submitting
    isSubmittingRef.current = true
    setLoading(true)

    // Log form values before processing
    logger.info('Form submission started', {
      formValues: {
        ...values,
        imagesCount: values.images?.length || 0,
        images: values.images,
      },
      formState: {
        isValid: form.formState.isValid,
        errors: form.formState.errors,
      }
    })

    // Check images from form values
    const currentImages = values.images || form.getValues('images') || []
    
    if (!currentImages || !Array.isArray(currentImages) || currentImages.length < 1) {
      toast.error('يرجى رفع صورة واحدة على الأقل قبل الحفظ')
      logger.warn('No images in form', {
        valuesImages: values.images,
        formImages: form.getValues('images'),
        currentImages
      })
      isSubmittingRef.current = false
      setLoading(false)
      return
    }

    try {
      // Get authentication token
      const token = await getToken()
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        router.push('/sign-in')
        return
      }

      // Filter out any invalid image URLs (empty strings, undefined, null)
      const validImages = currentImages.filter((img: string) => 
        img && typeof img === 'string' && img.trim().length > 0 && (img.startsWith('http://') || img.startsWith('https://'))
      )

      logger.info('Images validation', {
        originalCount: currentImages.length,
        validCount: validImages.length,
        validImages: validImages,
      })

      if (validImages.length === 0) {
        toast.error('يرجى رفع صورة واحدة على الأقل بصيغة صحيحة')
        isSubmittingRef.current = false
        setLoading(false)
        return
      }

      // Validate description (model requires it, even though validator allows optional)
      if (!values.description || String(values.description).trim().length === 0) {
        toast.error('يرجى إدخال وصف للمنتج')
        isSubmittingRef.current = false
        setLoading(false)
        return
      }
      
      // Validate category (must be MongoDB ObjectId)
      if (!values.category || String(values.category).trim().length === 0) {
        toast.error('يرجى اختيار فئة للمنتج')
        isSubmittingRef.current = false
        setLoading(false)
        return
      }
      
      // Validate price
      const price = parseFloat(String(values.price))
      if (isNaN(price) || price <= 0) {
        toast.error('يرجى إدخال سعر صحيح (أكبر من 0)')
        isSubmittingRef.current = false
        setLoading(false)
        return
      }
      
      // Validate stock (must be integer)
      const stock = parseInt(String(values.stock), 10)
      if (isNaN(stock) || stock < 0) {
        toast.error('يرجى إدخال مخزون صحيح (رقم صحيح أكبر من أو يساوي 0)')
        isSubmittingRef.current = false
        setLoading(false)
        return
      }
      
      // Filter sizes to match model enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'xxxl']
      // Note: 'xxxl' must be lowercase, others are uppercase
      const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'xxxl']
      const filteredSizes = Array.isArray(values.sizes) 
        ? values.sizes.map((size: string) => {
            const sizeStr = String(size).trim()
            // Convert XXXL to lowercase xxxl, others to uppercase
            if (sizeStr.toUpperCase() === 'XXXL') return 'xxxl'
            return sizeStr.toUpperCase()
          }).filter((size: string) => validSizes.includes(size))
        : []
      
      // Ensure all required fields are present and properly formatted
      // CRITICAL: Make sure images is a proper array
      const imagesArray = Array.isArray(validImages) ? validImages : []
      
      // Final validation - this should never fail if we got here
      if (imagesArray.length < 1) {
        const currentFormImages = form.getValues('images')
        toast.error(`خطأ: لا توجد صور. الصور الحالية في النموذج: ${currentFormImages?.length || 0}`)
        logger.error('FINAL CHECK: No images in array', {
          validImages,
          validImagesType: typeof validImages,
          validImagesIsArray: Array.isArray(validImages),
          formImages: currentFormImages,
          formImagesType: typeof currentFormImages,
          formImagesIsArray: Array.isArray(currentFormImages),
        })
        isSubmittingRef.current = false
        setLoading(false)
        return
      }

      // Build data based on product type
      const dataToSend: any = {
        name: String(values.name).trim(),
        description: String(values.description).trim(),
        category: String(values.category).trim(),
        images: imagesArray,
        isActive: values.isActive !== false,
      }

      if (values.productType === 'simple') {
        // Simple product
        dataToSend.price = price
        dataToSend.discountPrice = values.discountPrice ? parseFloat(String(values.discountPrice)) : 0
        dataToSend.stock = stock
        // Keep legacy sizes for backward compatibility
        if (filteredSizes.length > 0) {
          dataToSend.sizes = filteredSizes
        }
      } else {
        // Variant-based product
        dataToSend.attributes = values.attributes || []
        dataToSend.variants = (values.variants || []).map(v => ({
          ...v,
          discountPrice: v.discountPrice || 0,
          isActive: v.isActive !== false,
        }))
      }

      // Log the data being sent for debugging - BEFORE stringification
      console.log('📤 SENDING PRODUCT DATA:', {
        imagesCount: dataToSend.images.length,
        images: dataToSend.images,
        imagesType: typeof dataToSend.images,
        imagesIsArray: Array.isArray(dataToSend.images),
        fullData: JSON.stringify(dataToSend, null, 2),
      })

      logger.info('Sending product data to backend', {
        dataToSend: {
          ...dataToSend,
          imagesCount: dataToSend.images.length,
          images: dataToSend.images, // Log full images array
          imagesType: typeof dataToSend.images,
          imagesIsArray: Array.isArray(dataToSend.images),
          firstImage: dataToSend.images[0]?.substring(0, 50) + '...'
        }
      })

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // Final console log right before axios call
      console.log('🚀 ABOUT TO SEND TO AXIOS:', {
        url: isEdit ? `/products/${productId}` : '/products',
        method: isEdit ? 'PUT' : 'POST',
        images: dataToSend.images,
        imagesLength: dataToSend.images.length,
        imagesType: typeof dataToSend.images,
        isArray: Array.isArray(dataToSend.images),
        fullData: dataToSend,
      })

      if (isEdit && productId) {
        await axiosInstance.put(`/products/${productId}`, dataToSend, { headers })
        toast.success('تم تحديث المنتج بنجاح')
      } else {
        await axiosInstance.post('/products', dataToSend, { headers })
        toast.success('تم إنشاء المنتج بنجاح')
      }

      // Reset submission flag before navigation
      isSubmittingRef.current = false
      setLoading(false)
      
      router.push('/merchant/products')
    } catch (error: any) {
      // Reset submission flag on error
      isSubmittingRef.current = false
      
      logger.error('Error saving product', { 
        error: error instanceof Error ? error.message : String(error),
        status: error.response?.status,
        responseData: error.response?.data,
        requestData: {
          ...values,
          images: values.images,
          imagesCount: values.images?.length
        }
      })
      
      // More specific error messages
      if (error.response?.status === 401) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        router.push('/sign-in')
      } else if (error.response?.status === 403) {
        toast.error('ليس لديك صلاحية لإضافة منتجات. يرجى التأكد من أن حسابك معتمد.')
      } else if (error.response?.status === 400) {
        // Extract validation errors from response
        const errorData = error.response?.data
        const errorDetails = errorData?.error?.details || errorData?.details || errorData?.errors
        
        logger.error('Validation error details', {
          errorData,
          errorDetails,
          fullResponse: error.response?.data
        })
        
        if (errorDetails && Array.isArray(errorDetails)) {
          // Handle validation error details format from handleValidationErrors
          const errorMessages = errorDetails.map((e: any) => {
            const field = e.field || e.path || e.param || 'unknown'
            const msg = e.message || e.msg || 'Invalid value'
            return `${field}: ${msg}`
          })
          toast.error(`خطأ في التحقق: ${errorMessages.join('; ')}`)
          
          // Also log each error for debugging
          errorDetails.forEach((e: any) => {
            logger.error('Validation error', {
              field: e.field || e.path || e.param,
              message: e.message || e.msg,
              value: e.value
            })
          })
        } else if (errorDetails && typeof errorDetails === 'string') {
          toast.error(`خطأ في التحقق: ${errorDetails}`)
        } else {
          const errorMessage = errorData?.error?.message || errorData?.message || 'خطأ في البيانات المرسلة. يرجى التحقق من جميع الحقول.'
          toast.error(errorMessage)
        }
      } else {
        toast.error(error.response?.data?.message || 'فشل حفظ المنتج')
      }
    } finally {
      // Ensure we reset submission flag in finally block as well
      // (though it should already be reset in try/catch)
      if (isSubmittingRef.current) {
        isSubmittingRef.current = false
      }
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
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              // Prevent double submission at form level
              if (isSubmittingRef.current || loading) {
                logger.warn('Form submission blocked at form level', {
                  isSubmitting: isSubmittingRef.current,
                  loading,
                })
                return
              }
              
              // Log form state before submission
              const formValues = form.getValues()
              const formErrors = form.formState.errors
              const isValid = form.formState.isValid
              
              logger.info('Form submit triggered', {
                formValues: {
                  ...formValues,
                  imagesCount: formValues.images?.length || 0,
                },
                formErrors,
                isValid,
                errorsCount: Object.keys(formErrors).length,
              })
              
              // Check for validation errors and log them
              if (!isValid && Object.keys(formErrors).length > 0) {
                logger.warn('Form validation errors detected', {
                  errors: formErrors,
                })
                // Show first error to user
                const firstErrorKey = Object.keys(formErrors)[0]
                const firstError = formErrors[firstErrorKey as keyof typeof formErrors]
                if (firstError?.message) {
                  toast.error(`خطأ في التحقق: ${firstError.message}`)
                } else {
                  toast.error('يرجى التحقق من جميع الحقول المطلوبة')
                }
                return
              }
              
              // Submit the form
              form.handleSubmit(onSubmit, (errors) => {
                logger.error('Form validation failed', {
                  errors,
                  formValues: form.getValues(),
                })
                // Show validation errors
                const errorMessages = Object.entries(errors).map(([key, error]) => {
                  if (error?.message) {
                    return `${key}: ${error.message}`
                  }
                  return key
                })
                toast.error(`خطأ في التحقق: ${errorMessages.join(', ')}`)
              })(e)
            }} 
            className="space-y-6"
          >
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
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المنتج *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المنتج" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="simple">منتج بسيط (سعر ومخزون واحد)</SelectItem>
                      <SelectItem value="with_variants">منتج بمتغيرات (أحجام، ألوان، إلخ)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('productType') === 'simple' && (
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
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || value === null || value === undefined) {
                              field.onChange(undefined)
                            } else {
                              const numValue = parseFloat(value)
                              field.onChange(isNaN(numValue) ? undefined : numValue)
                            }
                          }}
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
            )}

            {form.watch('productType') === 'simple' && (
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
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || value === null || value === undefined) {
                            field.onChange(undefined)
                          } else {
                            const intValue = parseInt(value, 10)
                            field.onChange(isNaN(intValue) ? undefined : intValue)
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch('productType') === 'with_variants' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>تعريف الخصائص</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AttributeDefinitionManager
                      attributes={form.watch('attributes') || []}
                      onChange={(attrs) => form.setValue('attributes', attrs)}
                    />
                  </CardContent>
                </Card>

                {form.watch('attributes') && form.watch('attributes')!.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>المتغيرات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VariantManager
                        attributes={form.watch('attributes') || []}
                        variants={(form.watch('variants') || []).map(v => ({
                          ...v,
                          isActive: v.isActive !== false, // Ensure boolean, default to true
                        }))}
                        onChange={(vars) => form.setValue('variants', vars)}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div>
              <Label className="mb-2 block">صور المنتج *</Label>
              <ImageUpload onUploadComplete={handleUploadDone} />
              {form.watch('images') && form.watch('images').length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  تم رفع {form.watch('images').length} صورة
                </p>
              )}
              {form.formState.errors.images && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {form.formState.errors.images.message}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={loading || isSubmittingRef.current}
                onClick={(e) => {
                  // Debug: Log button click
                  console.log('Submit button clicked', {
                    loading,
                    isSubmitting: isSubmittingRef.current,
                    formValid: form.formState.isValid,
                    formErrors: form.formState.errors,
                    formValues: form.getValues(),
                  })
                  
                  // If button is disabled, don't do anything
                  if (loading || isSubmittingRef.current) {
                    e.preventDefault()
                    return
                  }
                  
                  // Let the form's onSubmit handle the rest
                  // The form's onSubmit will validate and submit
                }}
              >
                {loading || isSubmittingRef.current ? 'جاري الحفظ...' : isEdit ? 'تحديث المنتج' : 'إنشاء المنتج'}
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

