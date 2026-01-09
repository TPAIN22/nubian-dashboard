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
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ImageUpload from '@/components/imageUpload'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Stepper } from '@/components/ui/stepper'
import { AttributeDefinitionManager } from '@/components/product/AttributeDefinitionManager'
import { VariantManager } from '@/components/product/VariantManager'
import { ProductAttribute, ProductVariant } from '@/types/product.types'
import { ChevronRight, ChevronLeft, Package, Store } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  description: z.string().min(1, 'الوصف مطلوب'), // Model requires description
  category: z.string().min(1, 'الفئة مطلوبة'),
  images: z.array(z.string()).min(1, 'صورة واحدة على الأقل مطلوبة'),
  
  // Product type: 'simple' or 'with_variants' - required but can start empty
  productType: z.string().refine((val) => val === '' || val === 'simple' || val === 'with_variants', {
    message: 'نوع المنتج يجب أن يكون بسيط أو بمتغيرات',
  }),
  
  // For simple products
  price: z.number().min(0.01, 'السعر يجب أن يكون أكبر من 0').optional().or(z.undefined()),
  discountPrice: z.number().min(0, 'السعر بعد الخصم لا يمكن أن يكون سالباً').optional().or(z.undefined()),
  stock: z.number().int().min(0, 'المخزون لا يمكن أن يكون سالباً').optional().or(z.undefined()),
  
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
  
  // Admin-specific: merchant selection (optional - can be null for general products)
  merchant: z.string().optional(),
  
  isActive: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Validate productType
  const productType = data.productType as string
  if (!productType || (productType !== 'simple' && productType !== 'with_variants')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع المنتج مطلوب',
      path: ['productType'],
    })
  }
  
  // Validate price and discountPrice relationship for simple products
  if (productType === 'simple') {
    const price = data.price
    const discountPrice = data.discountPrice
    
    // If both prices are provided, discountPrice should be less than or equal to price
    if (price !== undefined && discountPrice !== undefined && discountPrice > price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'السعر المخفض يجب أن يكون أقل من أو يساوي السعر الأصلي',
        path: ['discountPrice'],
      })
    }
  }
  
  // Validate price and discountPrice relationship for variants
  if (data.variants && Array.isArray(data.variants)) {
    data.variants.forEach((variant, index) => {
      const variantPrice = variant.price
      const variantDiscountPrice = variant.discountPrice
      
      if (variantPrice !== undefined && variantDiscountPrice !== undefined && variantDiscountPrice > variantPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'السعر المخفض يجب أن يكون أقل من أو يساوي السعر الأصلي',
          path: ['variants', index, 'discountPrice'],
        })
      }
    })
  }
})

interface Category {
  _id: string
  name: string
}

interface Merchant {
  _id: string
  businessName: string
  businessEmail: string
  status: string
}

export default function ProductForm() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const [categories, setCategories] = useState<Category[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [merchantsLoading, setMerchantsLoading] = useState(true)
  const isSubmittingRef = useRef(false) // Prevent double submission
  const [currentStep, setCurrentStep] = useState(1)
  const maxStep = 5 // Total number of steps

  // Initialize form FIRST - must be before any hooks that reference it
  const form = useForm<z.infer<typeof formSchema>>({
    // @ts-expect-error - react-hook-form type inference issue with zod union types
    resolver: zodResolver(formSchema),
    mode: 'onBlur', // Validate on blur for better performance
    defaultValues: {
      name: '',
      description: '',
      productType: '' as any, // Empty string initially, will be validated when user selects
      price: undefined,
      discountPrice: undefined,
      category: '',
      stock: undefined,
      attributes: [],
      variants: [],
      sizes: [],
      colors: [],
      images: [],
      merchant: '',
      isActive: true,
    },
  })

  // Watch form values efficiently - only watch what we need
  const productType = useWatch({ control: form.control, name: 'productType' })
  const attributes = useWatch({ control: form.control, name: 'attributes' })
  const variants = useWatch({ control: form.control, name: 'variants' })
  const images = useWatch({ control: form.control, name: 'images' })

  // Verify admin role on component mount
  useEffect(() => {
    if (!userLoaded) {
      console.log('[ProductForm] Waiting for user to load...')
      return
    }
    
    if (!user) {
      console.warn('[ProductForm] No user found, redirecting to sign-in')
      router.replace('/sign-in')
      return
    }
    
    const userRole = user.publicMetadata?.role as string | undefined
    console.log('[ProductForm] User role check:', { 
      userRole, 
      userId: user.id,
      publicMetadata: user.publicMetadata 
    })
    
    // Admins should always be allowed
    if (userRole === 'admin') {
      console.log('[ProductForm] Admin access confirmed - allowing access')
      return
    }
    
    // Merchants should also be allowed (they can create products too)
    if (userRole === 'merchant') {
      console.log('[ProductForm] Merchant access confirmed - allowing access')
      return
    }
    
    // If user is not admin or merchant, don't allow access
    console.warn('[ProductForm] User is not admin or merchant, redirecting to dashboard:', {
      userRole,
      userId: user.id
    })
    router.replace('/business/dashboard')
  }, [userLoaded, user, router])

  // Fetch categories and merchants
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true)
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Authentication token not available')
        }
        const res = await axiosInstance.get('/categories', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setCategories(res.data || [])
      } catch (error) {
        logger.error('Failed to fetch categories', { error: error instanceof Error ? error.message : String(error) })
        toast.error('فشل تحميل التصنيفات')
      } finally {
        setCategoriesLoading(false)
      }
    }

    const fetchMerchants = async () => {
      setMerchantsLoading(true)
      try {
        const token = await getToken()
        if (!token) {
          return // Skip if no token
        }
        // Fetch approved merchants for admin selection
        const res = await axiosInstance.get('/merchants', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            status: 'APPROVED',
          },
        })
        // Handle different response formats
        const merchantsData = res.data?.data || res.data?.merchants || res.data || []
        setMerchants(Array.isArray(merchantsData) ? merchantsData : [])
      } catch (error) {
        logger.error('Failed to fetch merchants', { error: error instanceof Error ? error.message : String(error) })
        // Don't show error toast - merchants are optional for admin
      } finally {
        setMerchantsLoading(false)
      }
    }

    fetchCategories()
    fetchMerchants()
  }, [getToken])

  // Memoize step enabled check to avoid recalculation
  const formErrors = form.formState.errors
  const formValues = form.getValues()
  
  const stepStates = useMemo(() => {
    const states = {
      enabled: [true, false, false, false, false], // Step 1 always enabled
      completed: [false, false, false, false, false],
    }
    
    // Calculate enabled and completed states
    for (let i = 1; i <= 5; i++) {
      let isCompleted = false
      switch (i) {
        case 1:
          isCompleted = !formErrors.name && !formErrors.description && !formErrors.category &&
                       !!formValues.name?.trim() && !!formValues.description?.trim() && !!formValues.category?.trim()
          break
        case 2:
          const productTypeVal = formValues.productType as string
          isCompleted = !formErrors.productType && 
                       !!productTypeVal && 
                       (productTypeVal === 'simple' || productTypeVal === 'with_variants')
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

  const isStepEnabled = useCallback((step: number): boolean => {
    return stepStates.enabled[step - 1] ?? false
  }, [stepStates])

  const isStepCompleted = useCallback((step: number): boolean => {
    return stepStates.completed[step - 1] ?? false
  }, [stepStates])

  const validateStepInline = useCallback((step: number): boolean => {
    const values = form.getValues()
    const errors = form.formState.errors

    switch (step) {
      case 1:
        return !errors.name && !errors.description && !errors.category &&
               !!values.name?.trim() && !!values.description?.trim() && !!values.category?.trim()
      
      case 2:
        const productTypeVal = values.productType as string
        return !errors.productType && 
               !!productTypeVal && 
               (productTypeVal === 'simple' || productTypeVal === 'with_variants')
      
      case 3:
        if (values.productType === 'simple') {
          return !errors.price && !errors.stock &&
                 values.price !== undefined && values.price >= 0.01 &&
                 values.stock !== undefined && values.stock >= 0
        } else {
          const hasAttributes = !!(values.attributes && Array.isArray(values.attributes) && values.attributes.length > 0)
          const hasVariants = !!(values.variants && Array.isArray(values.variants) && values.variants.length > 0)
          return hasAttributes && hasVariants
        }
      
      case 4:
        const imgArray = values.images || []
        return !errors.images && Array.isArray(imgArray) && imgArray.length > 0
      
      case 5:
        return true
      
      default:
        return false
    }
  }, [form])

  // Navigate to next step
  const goToNextStep = useCallback(async () => {
    if (currentStep < maxStep) {
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
      
      const isValid = await form.trigger(fieldsToValidate)
      const isStepValid = validateStepInline(currentStep)
      
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

  const goToStep = (step: number) => {
    if (isStepEnabled(step)) {
      setCurrentStep(step)
    }
  }

  const handleUploadDone = useCallback((urls: string[]) => {
    const validUrls = urls.filter((url: string) => 
      url && 
      typeof url === 'string' && 
      url.trim().length > 0 && 
      (url.startsWith('http://') || url.startsWith('https://'))
    )
    
    form.setValue('images', validUrls, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }, [form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Prevent double submission
    if (isSubmittingRef.current || loading) {
      logger.warn('Form submission blocked - already submitting')
      return
    }

    isSubmittingRef.current = true
    setLoading(true)

    const currentImages = values.images || form.getValues('images') || []
    
    if (!currentImages || !Array.isArray(currentImages) || currentImages.length < 1) {
      toast.error('يرجى رفع صورة واحدة على الأقل قبل الحفظ')
      isSubmittingRef.current = false
      setLoading(false)
      return
    }

    try {
      const token = await getToken()
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        router.push('/sign-in')
        return
      }

      const validImages = currentImages.filter((img: string) => 
        img && typeof img === 'string' && img.trim().length > 0 && (img.startsWith('http://') || img.startsWith('https://'))
      )

      if (validImages.length === 0) {
        toast.error('يرجى رفع صورة واحدة على الأقل بصيغة صحيحة')
        isSubmittingRef.current = false
        setLoading(false)
        return
      }

      if (!values.description || String(values.description).trim().length === 0) {
        toast.error('يرجى إدخال وصف للمنتج')
        isSubmittingRef.current = false
        setLoading(false)
        return
      }
      
      if (!values.category || String(values.category).trim().length === 0) {
        toast.error('يرجى اختيار فئة للمنتج')
        isSubmittingRef.current = false
        setLoading(false)
        return
      }
      
      const productTypeVal = values.productType as string
      if (!productTypeVal || (productTypeVal !== 'simple' && productTypeVal !== 'with_variants')) {
        toast.error('يرجى اختيار نوع المنتج')
        isSubmittingRef.current = false
        setLoading(false)
        return
      }
      
      const parseNumber = (value: any): number | undefined => {
        if (value === undefined || value === null || value === '') {
          return undefined
        }
        if (typeof value === 'number') {
          return isNaN(value) ? undefined : value
        }
        const parsed = parseFloat(String(value))
        return isNaN(parsed) ? undefined : parsed
      }
      
      if (values.productType === 'simple') {
        const price = parseNumber(values.price)
        if (price === undefined || price <= 0) {
          toast.error('يرجى إدخال سعر صحيح (أكبر من 0)')
          isSubmittingRef.current = false
          setLoading(false)
          return
        }
        
        const discountPrice = parseNumber(values.discountPrice)
        if (discountPrice !== undefined && discountPrice > 0 && discountPrice > price) {
          toast.error('السعر المخفض يجب أن يكون أقل من أو يساوي السعر الأصلي')
          isSubmittingRef.current = false
          setLoading(false)
          return
        }
        
        const stock = parseNumber(values.stock)
        if (stock === undefined || stock < 0 || !Number.isInteger(stock)) {
          toast.error('يرجى إدخال مخزون صحيح (رقم صحيح أكبر من أو يساوي 0)')
          isSubmittingRef.current = false
          setLoading(false)
          return
        }
      } else {
        if (!values.attributes || !Array.isArray(values.attributes) || values.attributes.length === 0) {
          toast.error('يرجى إضافة خاصية واحدة على الأقل للمنتج')
          isSubmittingRef.current = false
          setLoading(false)
          return
        }
        
        if (!values.variants || !Array.isArray(values.variants) || values.variants.length === 0) {
          toast.error('يرجى إضافة متغير واحد على الأقل للمنتج')
          isSubmittingRef.current = false
          setLoading(false)
          return
        }
        
        for (let i = 0; i < values.variants.length; i++) {
          const variant = values.variants[i]
          const variantPrice = variant.price
          const variantDiscountPrice = variant.discountPrice
          
          if (variantPrice !== undefined && variantDiscountPrice !== undefined && variantDiscountPrice > variantPrice) {
            toast.error(`المتغير ${i + 1}: السعر المخفض يجب أن يكون أقل من أو يساوي السعر الأصلي`)
            isSubmittingRef.current = false
            setLoading(false)
            return
          }
        }
      }
      
      const imagesArray = Array.isArray(validImages) ? validImages : []
      
      if (imagesArray.length < 1) {
        toast.error('خطأ: لا توجد صور')
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

      // Add merchant if selected (admin can create products for specific merchants)
      if (values.merchant && values.merchant.trim()) {
        dataToSend.merchant = values.merchant.trim()
      }
      // If merchant is empty, product will be created without merchant (general product)

      if (values.productType === 'simple') {
        const priceValue = parseNumber(values.price)
        const discountPriceValue = parseNumber(values.discountPrice)
        const stockValue = parseNumber(values.stock)
        
        if (priceValue !== undefined && priceValue > 0) {
          dataToSend.price = priceValue
        } else {
          toast.error('خطأ في السعر. يرجى التحقق من القيمة المدخلة.')
          isSubmittingRef.current = false
          setLoading(false)
          return
        }
        
        if (discountPriceValue !== undefined && discountPriceValue > 0) {
          dataToSend.discountPrice = discountPriceValue
        }
        
        if (stockValue !== undefined && stockValue >= 0) {
          dataToSend.stock = Math.floor(stockValue)
        } else {
          toast.error('خطأ في المخزون. يرجى التحقق من القيمة المدخلة.')
          isSubmittingRef.current = false
          setLoading(false)
          return
        }
      } else {
        dataToSend.attributes = values.attributes || []
        dataToSend.variants = (values.variants || []).map(v => ({
          ...v,
          price: v.price || 0,
          isActive: v.isActive !== false,
        }))
      }

      logger.info('Sending product data to backend', {
        dataToSend: {
          ...dataToSend,
          imagesCount: dataToSend.images.length,
        }
      })

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      await axiosInstance.post('/products', dataToSend, { headers })
      toast.success('تم إنشاء المنتج بنجاح')

      isSubmittingRef.current = false
      setLoading(false)
      
      // Reset form and redirect
      form.reset({
        name: '',
        description: '',
        productType: '' as any,
        price: undefined,
        discountPrice: undefined,
        category: '',
        stock: undefined,
        attributes: [],
        variants: [],
        sizes: [],
        colors: [],
        images: [],
        merchant: '',
        isActive: true,
      })
      setCurrentStep(1)
      
      setTimeout(() => {
        router.push('/business/products')
      }, 500)
    } catch (error: any) {
      isSubmittingRef.current = false
      
      logger.error('Error saving product', { 
        error: error instanceof Error ? error.message : String(error),
        status: error.response?.status,
        responseData: error.response?.data,
      })
      
      if (error.response?.status === 401) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        router.push('/sign-in')
      } else if (error.response?.status === 403) {
        const errorData = error.response?.data
        const errorCode = errorData?.code
        const userRole = user?.publicMetadata?.role as string | undefined
        
        // Only redirect merchants, not admins
        if (errorCode === 'MERCHANT_NOT_FOUND' || errorCode === 'MERCHANT_NOT_APPROVED') {
          if (userRole === 'merchant') {
            router.push('/merchant/apply')
            return
          }
        }
        toast.error('ليس لديك صلاحية لإضافة منتجات.')
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data
        const errorDetails = errorData?.error?.details || errorData?.details || errorData?.errors
        
        if (errorDetails && Array.isArray(errorDetails)) {
          const errorMessages = errorDetails.map((e: any) => {
            const field = e.field || e.path || e.param || 'unknown'
            const msg = e.message || e.msg || 'Invalid value'
            return `${field}: ${msg}`
          })
          toast.error(`خطأ في التحقق: ${errorMessages.join('; ')}`)
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
      if (isSubmittingRef.current) {
        isSubmittingRef.current = false
      }
      setLoading(false)
    }
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
    <div className="min-h-screen bg-gradient-to-br p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg bg-primary/10">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">إضافة منتج جديد</h1>
          <p className="text-muted-foreground">أضف منتجك الجديد إلى المتجر بسهولة</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>إنشاء منتج جديد</CardTitle>
            <CardDescription>املأ جميع الخطوات لإضافة منتج جديد</CardDescription>
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
                  if (currentStep === 5) {
                    if (isSubmittingRef.current || loading) {
                      return
                    }
                    form.handleSubmit(onSubmit as any, (errors) => {
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
                      control={form.control as any}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            اسم المنتج *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل اسم المنتج" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            الوصف *
                          </FormLabel>
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
                      control={form.control as any}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الفئة *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={categoriesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={categoriesLoading ? "جاري التحميل..." : "اختر فئة"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoriesLoading ? (
                                <SelectItem value="loading" disabled>
                                  جاري تحميل التصنيفات...
                                </SelectItem>
                              ) : categories.length === 0 ? (
                                <SelectItem value="no-categories" disabled>
                                  لا توجد تصنيفات متاحة
                                </SelectItem>
                              ) : (
                                categories.map((category) => (
                                  <SelectItem key={category._id} value={category._id}>
                                    {category.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Admin-specific: Merchant selection */}
                    {user?.publicMetadata?.role === 'admin' && (
                      <FormField
                        control={form.control as any}
                        name="merchant"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Store className="w-4 h-4" />
                              التاجر (اختياري)
                            </FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                                value={field.value || 'none'}
                                disabled={merchantsLoading}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={merchantsLoading ? "جاري التحميل..." : "اختر تاجر (اختياري)"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">لا تاجر (منتج عام)</SelectItem>
                                  {merchantsLoading ? (
                                    <SelectItem value="loading" disabled>
                                      جاري تحميل التجار...
                                    </SelectItem>
                                  ) : merchants.length === 0 ? (
                                    <SelectItem value="no-merchants" disabled>
                                      لا يوجد تجار متاحين
                                    </SelectItem>
                                  ) : (
                                    merchants.map((merchant) => (
                                      <SelectItem key={merchant._id} value={merchant._id}>
                                        {merchant.businessName}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              يمكنك ترك هذا الحقل فارغاً لإنشاء منتج عام، أو اختيار تاجر محدد
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Step 2: Product Type */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">اختر نوع المنتج</h3>
                    <FormField
                      control={form.control as any}
                      name="productType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع المنتج *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value)
                              form.trigger('productType')
                            }} 
                            value={field.value || undefined}
                          >
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
                          <FormDescription>
                            اختر &quot;منتج بسيط&quot; للمنتجات التي لها سعر ومخزون واحد، أو &quot;منتج بمتغيرات&quot; للمنتجات التي لها أحجام أو ألوان مختلفة.
                          </FormDescription>
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
                            control={form.control as any}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>السعر الأصلي *</FormLabel>
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
                                      form.trigger(['discountPrice', 'price'])
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control as any}
                            name="discountPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>السعر بعد الخصم (اختياري)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="السعر قبل الخصم"
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
                                      form.trigger(['discountPrice', 'price'])
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control as any}
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
                            <CardDescription>
                              قم بتعريف الخصائص التي سيتم استخدامها في المتغيرات (مثل: الحجم، اللون، المادة)
                            </CardDescription>
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
                              <CardDescription>
                                قم بإضافة المتغيرات للمنتج بناءً على الخصائص المعرفة
                              </CardDescription>
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
                      {user?.publicMetadata?.role === 'admin' && form.getValues('merchant') && (
                        <div>
                          <Label className="text-sm font-semibold">التاجر:</Label>
                          <p className="text-sm">
                            {merchants.find(m => m._id === form.getValues('merchant'))?.businessName || 'غير محدد'}
                          </p>
                        </div>
                      )}
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
                          {form.getValues('discountPrice') && (
                            <div>
                              <Label className="text-sm font-semibold">السعر بعد الخصم:</Label>
                              <p className="text-sm">{form.getValues('discountPrice')} ر.س</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-sm font-semibold">المخزون:</Label>
                            <p className="text-sm">{form.getValues('stock') ?? 'غير محدد'}</p>
                          </div>
                        </>
                      )}
                      {productType === 'with_variants' && (
                        <>
                          <div>
                            <Label className="text-sm font-semibold">عدد الخصائص:</Label>
                            <p className="text-sm">{(attributes || []).length}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold">عدد المتغيرات:</Label>
                            <p className="text-sm">{(variants || []).length}</p>
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
                      onClick={() => router.push('/business/products')}
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
                        {loading || isSubmittingRef.current ? 'جاري الحفظ...' : 'إنشاء المنتج'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
