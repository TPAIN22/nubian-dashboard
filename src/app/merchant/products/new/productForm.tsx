'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { useForm, useWatch } from 'react-hook-form'
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
import { Stepper } from '@/components/ui/stepper'
import { AttributeDefinitionManager } from '@/components/product/AttributeDefinitionManager'
import { VariantManager } from '@/components/product/VariantManager'
import { ProductAttribute, ProductVariant } from '@/types/product.types'
import { ChevronRight, ChevronLeft } from 'lucide-react'

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
  const [currentStep, setCurrentStep] = useState(1)
  const maxStep = 5 // Total number of steps

  // Initialize form FIRST - must be before any hooks that reference it
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur', // Validate on blur for better performance
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

  // Watch form values efficiently - only watch what we need
  // These must come AFTER form initialization
  const productType = useWatch({ control: form.control, name: 'productType' })
  const attributes = useWatch({ control: form.control, name: 'attributes' })
  const variants = useWatch({ control: form.control, name: 'variants' })
  const images = useWatch({ control: form.control, name: 'images' })

  // Memoize step enabled check to avoid recalculation
  // Only recalculate when form values actually change
  const formErrors = form.formState.errors
  const formValues = form.getValues()
  
  const stepStates = useMemo(() => {
    const states = {
      enabled: [true, false, false, false, false], // Step 1 always enabled
      completed: [false, false, false, false, false],
    }
    
    // Calculate enabled and completed states
    for (let i = 1; i <= 5; i++) {
      // Check if step is completed
      let isCompleted = false
      switch (i) {
        case 1:
          isCompleted = !formErrors.name && !formErrors.description && !formErrors.category &&
                       !!formValues.name?.trim() && !!formValues.description?.trim() && !!formValues.category?.trim()
          break
        case 2:
          isCompleted = !formErrors.productType && !!formValues.productType
          break
        case 3:
          if (formValues.productType === 'simple') {
            isCompleted = !formErrors.price && !formErrors.stock &&
                         formValues.price !== undefined && formValues.price >= 0.01 &&
                         formValues.stock !== undefined && formValues.stock >= 0
          } else {
            const hasAttrs = !!(formValues.attributes && Array.isArray(formValues.attributes) && formValues.attributes.length > 0)
            const hasVars = !!(formValues.variants && Array.isArray(formValues.variants) && formValues.variants.length > 0)
            isCompleted = hasAttrs && hasVars
          }
          break
        case 4:
          const imgArray = formValues.images || []
          isCompleted = !formErrors.images && Array.isArray(imgArray) && imgArray.length > 0
          break
        case 5:
          isCompleted = true
          break
      }
      
      states.completed[i - 1] = isCompleted
      
      if (i > 1) {
        // Check if all previous steps are completed
        let allPreviousCompleted = true
        for (let j = 0; j < i - 1; j++) {
          if (!states.completed[j]) {
            allPreviousCompleted = false
            break
          }
        }
        states.enabled[i - 1] = allPreviousCompleted
      }
    }
    
    return states
  }, [
    formErrors.name,
    formErrors.description,
    formErrors.category,
    formErrors.productType,
    formErrors.price,
    formErrors.stock,
    formErrors.attributes,
    formErrors.variants,
    formErrors.images,
    formValues.name,
    formValues.description,
    formValues.category,
    formValues.productType,
    formValues.price,
    formValues.stock,
    formValues.attributes,
    formValues.variants,
    formValues.images,
  ])

  // Check if a step is enabled
  const isStepEnabled = useCallback((step: number): boolean => {
    return stepStates.enabled[step - 1] ?? false
  }, [stepStates])

  // Check if a step is completed
  const isStepCompleted = useCallback((step: number): boolean => {
    return stepStates.completed[step - 1] ?? false
  }, [stepStates])

  // Helper function to validate a step with current form state (not memoized)
  const validateStepInline = useCallback((step: number): boolean => {
    const values = form.getValues()
    const errors = form.formState.errors

    switch (step) {
      case 1: // Basic Info: name, description, category
        return !errors.name && !errors.description && !errors.category &&
               !!values.name?.trim() && !!values.description?.trim() && !!values.category?.trim()
      
      case 2: // Product Type
        return !errors.productType && !!values.productType
      
      case 3: // Product Details
        if (values.productType === 'simple') {
          return !errors.price && !errors.stock &&
                 values.price !== undefined && values.price >= 0.01 &&
                 values.stock !== undefined && values.stock >= 0
        } else {
          const hasAttributes = !!(values.attributes && Array.isArray(values.attributes) && values.attributes.length > 0)
          const hasVariants = !!(values.variants && Array.isArray(values.variants) && values.variants.length > 0)
          return hasAttributes && hasVariants
        }
      
      case 4: // Images
        const imgArray = values.images || []
        return !errors.images && Array.isArray(imgArray) && imgArray.length > 0
      
      case 5: // Review (always enabled if we got here)
        return true
      
      default:
        return false
    }
  }, [form])

  // Navigate to next step
  const goToNextStep = useCallback(async () => {
    if (currentStep < maxStep) {
      // Trigger validation only for current step fields
      let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = []
      
      switch (currentStep) {
        case 1:
          fieldsToValidate = ['name', 'description', 'category']
          break
        case 2:
          fieldsToValidate = ['productType']
          break
        case 3:
          if (productType === 'simple') {
            fieldsToValidate = ['price', 'stock']
          } else {
            fieldsToValidate = ['attributes', 'variants']
          }
          break
        case 4:
          fieldsToValidate = ['images']
          break
      }
      
      // Trigger validation and wait for it to complete
      const isValid = await form.trigger(fieldsToValidate)
      
      // Validate the step inline using current form state (not memoized stepStates)
      // This ensures we use the fresh validation results, not stale memoized values
      const isStepValid = validateStepInline(currentStep)
      
      // Use the validation result from form.trigger() as primary check
      // Also check step validation to ensure all conditions are met
      if (isValid && isStepValid) {
        setCurrentStep(currentStep + 1)
      } else {
        toast.error('يرجى إكمال جميع الحقول المطلوبة في هذه المرحلة')
      }
    }
  }, [currentStep, form, productType, validateStepInline])

  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Memoized stage validation functions - only validate when needed
  // This uses memoized stepStates for display purposes
  const validateStep = useCallback((step: number): boolean => {
    return stepStates.completed[step - 1] ?? false
  }, [stepStates])

  // Navigate to specific step (only if enabled)
  const goToStep = (step: number) => {
    if (isStepEnabled(step)) {
      setCurrentStep(step)
    }
  }

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

  // Define steps for the stepper
  const steps = [
    {
      title: 'المعلومات الأساسية',
      description: 'الاسم والوصف والفئة',
      isCompleted: isStepCompleted(1),
      isActive: currentStep === 1,
      isEnabled: isStepEnabled(1),
    },
    {
      title: 'نوع المنتج',
      description: 'بسيط أو متغيرات',
      isCompleted: isStepCompleted(2),
      isActive: currentStep === 2,
      isEnabled: isStepEnabled(2),
    },
    {
      title: 'تفاصيل المنتج',
      description: productType === 'simple' ? 'السعر والمخزون' : 'الخصائص والمتغيرات',
      isCompleted: isStepCompleted(3),
      isActive: currentStep === 3,
      isEnabled: isStepEnabled(3),
    },
    {
      title: 'الصور',
      description: 'رفع صور المنتج',
      isCompleted: isStepCompleted(4),
      isActive: currentStep === 4,
      isEnabled: isStepEnabled(4),
    },
    {
      title: 'المراجعة',
      description: 'مراجعة وإرسال',
      isCompleted: false,
      isActive: currentStep === 5,
      isEnabled: isStepEnabled(5),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'تعديل المنتج' : 'إنشاء منتج'}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stepper */}
        <div className="mb-8">
          <Stepper steps={steps} />
        </div>

        <Form {...form}>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              // On step 5, submit the form
              if (currentStep === 5) {
                if (isSubmittingRef.current || loading) {
                  return
                }
                form.handleSubmit(onSubmit, (errors) => {
                  logger.error('Form validation failed', { errors })
                  const errorMessages = Object.entries(errors).map(([key, error]) => {
                    if (error?.message) {
                      return `${key}: ${error.message}`
                    }
                    return key
                  })
                  toast.error(`خطأ في التحقق: ${errorMessages.join(', ')}`)
                })(e)
              } else {
                // Otherwise, go to next step
                goToNextStep()
              }
            }} 
            className="space-y-6"
          >
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">المعلومات الأساسية</h3>
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
                      <FormLabel>الوصف *</FormLabel>
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
              </div>
            )}

            {/* Step 2: Product Type */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">اختر نوع المنتج</h3>
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
                      <p className="text-sm text-muted-foreground mt-2">
                        اختر &quot;منتج بسيط&quot; للمنتجات التي لها سعر ومخزون واحد، أو &quot;منتج بمتغيرات&quot; للمنتجات التي لها أحجام أو ألوان مختلفة.
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Product Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">
                  {productType === 'simple' ? 'السعر والمخزون' : 'الخصائص والمتغيرات'}
                </h3>
                
                {productType === 'simple' ? (
                  <>
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
                  </>
                ) : (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>تعريف الخصائص</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AttributeDefinitionManager
                          attributes={attributes || []}
                          onChange={(attrs) => {
                      form.setValue('attributes', attrs, { shouldValidate: false })
                    }}
                        />
                      </CardContent>
                    </Card>

                    {attributes && attributes.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>المتغيرات</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <VariantManager
                            attributes={attributes || []}
                            variants={(variants || []).map(v => ({
                              ...v,
                              isActive: v.isActive !== false,
                            }))}
                            onChange={(vars) => {
                              form.setValue('variants', vars, { shouldValidate: false })
                            }}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Images */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">صور المنتج</h3>
                <div>
                  <Label className="mb-2 block">صور المنتج *</Label>
                  <ImageUpload onUploadComplete={handleUploadDone} />
                  {images && images.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      تم رفع {images.length} صورة
                    </p>
                  )}
                  {form.formState.errors.images && (
                    <p className="text-sm font-medium text-destructive mt-1">
                      {form.formState.errors.images.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">مراجعة المعلومات</h3>
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-sm font-semibold">اسم المنتج:</Label>
                    <p className="text-sm">{form.getValues('name') || 'غير محدد'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">الوصف:</Label>
                    <p className="text-sm">{form.getValues('description') || 'غير محدد'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">الفئة:</Label>
                    <p className="text-sm">
                      {categories.find(c => c._id === form.getValues('category'))?.name || 'غير محدد'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">نوع المنتج:</Label>
                    <p className="text-sm">
                      {productType === 'simple' ? 'منتج بسيط' : 'منتج بمتغيرات'}
                    </p>
                  </div>
                  {productType === 'simple' && (
                    <>
                      <div>
                        <Label className="text-sm font-semibold">السعر:</Label>
                        <p className="text-sm">{form.getValues('price') || 'غير محدد'} ر.س</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">المخزون:</Label>
                        <p className="text-sm">{form.getValues('stock') ?? 'غير محدد'}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <Label className="text-sm font-semibold">عدد الصور:</Label>
                    <p className="text-sm">{images?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-6 border-t">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                  >
                    <ChevronRight className="w-4 h-4 ml-2" />
                    السابق
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/merchant/products')}
                >
                  إلغاء
                </Button>
              </div>
              
              <div className="flex gap-2">
                {currentStep < maxStep ? (
                  <Button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault()
                      goToNextStep()
                    }}
                  >
                    التالي
                    <ChevronLeft className="w-4 h-4 mr-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || isSubmittingRef.current}
                  >
                    {loading || isSubmittingRef.current ? 'جاري الحفظ...' : isEdit ? 'تحديث المنتج' : 'إنشاء المنتج'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

