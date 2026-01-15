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
  FormDescription,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Stepper } from '@/components/ui/stepper'
import { AttributeDefinitionManager } from '@/components/product/AttributeDefinitionManager'
import { VariantManager } from '@/components/product/VariantManager'
import { PricingPreview } from '@/components/product/PricingPreview'
import { ProductAttributeDefDTO as ProductAttribute, ProductVariantDTO as ProductVariant } from '@/domain/product/product.types'
import { ChevronRight, ChevronLeft, Package, Info, CheckCircle2, Type, Layers, Image as ImageIcon, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'), // Model requires description
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  
  // Product type: 'simple' or 'with_variants' - required but can start empty
  productType: z.string().refine((val) => val === '' || val === 'simple' || val === 'with_variants', {
    message: 'Product type must be either simple or with_variants',
  }),
  
  // For simple products - Smart pricing fields
  merchantPrice: z.number().min(0.01, 'Merchant price must be greater than 0').optional().or(z.undefined()),
  nubianMarkup: z.number().min(0, 'Nubian markup cannot be negative').max(100, 'Nubian markup cannot exceed 100%').optional().or(z.undefined()),
  // Legacy fields (for backward compatibility)
  price: z.number().min(0.01, 'Price must be greater than 0').optional().or(z.undefined()),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional().or(z.undefined()),
  
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
    // discountPrice removed - pricing handled by smart pricing system
    stock: z.number().int().min(0),
    images: z.array(z.string()).optional(),
    isActive: z.boolean(),
  })).optional(),
  
  // Legacy fields (for backward compatibility)
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  
  isActive: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Only validate productType here - don't validate price/stock/attributes/variants
  // This allows stage 2 validation to pass when only productType is selected
  // Price, stock, attributes, and variants are validated by their individual field validators
  const productType = data.productType as string
  if (!productType || (productType !== 'simple' && productType !== 'with_variants')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Product type is required',
      path: ['productType'],
    })
  }
  
  // Note: discountPrice validation removed - pricing is now handled by smart pricing system
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
    // @ts-expect-error - react-hook-form type inference issue with zod union types
    resolver: zodResolver(formSchema),
    mode: 'onBlur', // Validate on blur for better performance
    defaultValues: {
      name: '',
      description: '',
      productType: '' as any, // Empty string initially, will be validated when user selects
      merchantPrice: undefined,
      nubianMarkup: 10, // Default 10%
      price: undefined, // Legacy field
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
  const name = useWatch({ control: form.control, name: 'name' })
  const description = useWatch({ control: form.control, name: 'description' })

  // Memoize variants for VariantManager to avoid re-renders
  const memoizedVariants = useMemo(() => {
    return (variants || []).map(v => ({
      ...v,
      merchantPrice: (v as any).merchantPrice ?? v.price,
      price: v.price ?? (v as any).merchantPrice,
      isActive: v.isActive !== false,
    }))
  }, [variants])

  // Memoize step enabled check to avoid recalculation
  // Only recalculate when form values actually change
  const formErrors = form.formState.errors
  const formValues = form.getValues()
  
  const stepStates = useMemo(() => {
    const states = {
      enabled: [true, false, false, false, false], // Step 1 always enabled
      completed: [false, false, false, false, false],
    }
    
    // Use watched values for better performance and stability
    const currentValues = {
      name,
      description,
      category: form.getValues('category'),
      productType,
      merchantPrice: form.getValues('merchantPrice'),
      price: form.getValues('price'),
      stock: form.getValues('stock'),
      attributes,
      variants,
      images
    }

    // Calculate enabled and completed states
    for (let i = 1; i <= 5; i++) {
      // Check if step is completed
      let isCompleted = false
      switch (i) {
        case 1:
          isCompleted = !formErrors.name && !formErrors.description && !formErrors.category &&
                       !!currentValues.name?.trim() && !!currentValues.description?.trim() && !!currentValues.category?.trim()
          break
        case 2:
          isCompleted = !formErrors.productType && 
                       !!currentValues.productType && 
                       (currentValues.productType === 'simple' || currentValues.productType === 'with_variants')
          break
        case 3:
          if (currentValues.productType === 'simple') {
            const mPrice = currentValues.merchantPrice || currentValues.price
            isCompleted = !formErrors.merchantPrice && !formErrors.price && !formErrors.stock &&
                         mPrice !== undefined && mPrice >= 0.01 &&
                         currentValues.stock !== undefined && currentValues.stock >= 0
          } else {
            const hasAttrs = !!(currentValues.attributes && Array.isArray(currentValues.attributes) && currentValues.attributes.length > 0)
            const hasVars = !!(currentValues.variants && Array.isArray(currentValues.variants) && currentValues.variants.length > 0)
            isCompleted = hasAttrs && hasVars
          }
          break
        case 4:
          isCompleted = !formErrors.images && Array.isArray(currentValues.images) && currentValues.images.length > 0
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
    formErrors,
    name,
    description,
    productType,
    attributes,
    variants,
    images,
    form
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
        // Step 2 is only completed if productType is explicitly selected
        const productTypeVal = values.productType as string
        return !errors.productType && 
               !!productTypeVal && 
               (productTypeVal === 'simple' || productTypeVal === 'with_variants')
      
      case 3: // Product Details
        if (values.productType === 'simple') {
          const merchantPrice = values.merchantPrice || values.price
          return !errors.merchantPrice && !errors.price && !errors.stock &&
                 merchantPrice !== undefined && merchantPrice >= 0.01 &&
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
        // Handle standardized response format: { success: true, data: { merchant, hasApplication }, message: "..." }
        const responseData = response.data?.data || response.data

        if (responseData.hasApplication && responseData.merchant?.status === 'APPROVED') {
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
            merchantPrice: product.merchantPrice || product.price || undefined,
            nubianMarkup: product.nubianMarkup || 10,
            price: product.price || undefined, // Legacy field
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
        const merchantPrice = parseNumber(values.merchantPrice) || parseNumber(values.price)
        if (merchantPrice === undefined || merchantPrice <= 0) {
          toast.error('يرجى إدخال سعر صحيح (أكبر من 0)')
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
      }
      
      const imagesArray = Array.isArray(validImages) ? validImages : []
      
      const dataToSend: any = {
        name: String(values.name).trim(),
        description: String(values.description).trim(),
        category: String(values.category).trim(),
        images: imagesArray,
        isActive: values.isActive !== false,
      }

      if (values.productType === 'simple') {
        const merchantPriceValue = parseNumber(values.merchantPrice) || parseNumber(values.price)
        const nubianMarkupValue = parseNumber(values.nubianMarkup) || 10
        const stockValue = parseNumber(values.stock)
        
        if (merchantPriceValue !== undefined && merchantPriceValue > 0) {
          dataToSend.merchantPrice = merchantPriceValue
          dataToSend.price = merchantPriceValue
        } else {
          toast.error('خطأ في السعر. يرجى التحقق من القيمة المدخلة.')
          isSubmittingRef.current = false
          setLoading(false)
          return
        }
        
        if (nubianMarkupValue !== undefined && nubianMarkupValue >= 0) {
          dataToSend.nubianMarkup = nubianMarkupValue
        }

        // discountPrice removed - handled automatically by dynamic pricing
        
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
          merchantPrice: v.merchantPrice || v.price || 0,
          price: v.price || v.merchantPrice || 0,
          nubianMarkup: v.nubianMarkup ?? 10,
          isActive: v.isActive !== false,
        }))
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      if (isEdit && productId) {
        await axiosInstance.put(`/products/${productId}`, dataToSend, { headers })
        toast.success('تم تحديث المنتج بنجاح')
        
        isSubmittingRef.current = false
        setLoading(false)
        
        router.push('/merchant/products')
      } else {
        await axiosInstance.post('/products', dataToSend, { headers })
        toast.success('تم إنشاء المنتج بنجاح')

        isSubmittingRef.current = false
        setLoading(false)
        
        form.reset({
          name: '',
          description: '',
          productType: '' as any,
          merchantPrice: undefined,
          nubianMarkup: 10,
          price: undefined,
          category: '',
          stock: undefined,
          attributes: [],
          variants: [],
          sizes: [],
          colors: [],
          images: [],
          isActive: true,
        })
        setCurrentStep(1)
        
        setTimeout(() => {
          router.push('/merchant/products')
        }, 500)
      }
    } catch (error: any) {
      isSubmittingRef.current = false
      setLoading(false)
      
      logger.error('Error saving product', { 
        error: error instanceof Error ? error.message : String(error),
        status: error.response?.status,
        responseData: error.response?.data,
      })
      
      if (error.response?.status === 401) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        router.push('/sign-in')
      } else if (error.response?.status === 403) {
        toast.error('ليس لديك صلاحية لإضافة منتجات. يرجى التأكد من أن حسابك معتمد.')
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
    <div className="min-h-screen bg-gradient-to-br p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg bg-primary/10">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'قم بتعديل معلومات المنتج' : 'أضف منتجك الجديد إلى المتجر بسهولة'}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'تعديل المنتج' : 'إنشاء منتج جديد'}</CardTitle>
            <p className="text-muted-foreground text-sm">{isEdit ? 'قم بتعديل معلومات المنتج في جميع الخطوات' : 'املأ جميع الخطوات لإضافة منتج جديد'}</p>
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
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Type className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">المعلومات الأساسية للمنتج</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control as any}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">اسم المنتج *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="مثال: فستان سهرة مخمل، هاتف سامسونج S24" 
                                className="h-11 rounded-lg"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>سيظهر هذا الاسم للمتسوقين في المتجر</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">الوصف التفصيلي *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="اكتب وصفاً جذاباً وشاملاً لمميزات المنتج ومواصفاته..."
                                rows={5}
                                className="rounded-lg resize-none"
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
                            <FormLabel className="font-semibold">الفئة *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-lg">
                                  <SelectValue placeholder="اختر فئة المنتج" />
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
                  </div>
                )}

                {/* Step 2: Product Type */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">اختر نوع المنتج</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={cn(
                          "relative cursor-pointer rounded-xl border-2 p-6 transition-all hover:border-primary/50",
                          productType === 'simple' ? "border-primary bg-primary/5 shadow-md" : "border-muted bg-card"
                        )}
                        onClick={() => {
                          form.setValue('productType', 'simple');
                          form.trigger('productType');
                        }}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                            productType === 'simple' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">منتج بسيط</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              للمنتجات التي لها سعر ومخزون واحد فقط (مثل كتاب، زجاجة عطر)
                            </p>
                          </div>
                          {productType === 'simple' && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div 
                        className={cn(
                          "relative cursor-pointer rounded-xl border-2 p-6 transition-all hover:border-primary/50",
                          productType === 'with_variants' ? "border-primary bg-primary/5 shadow-md" : "border-muted bg-card"
                        )}
                        onClick={() => {
                          form.setValue('productType', 'with_variants');
                          form.trigger('productType');
                        }}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                            productType === 'with_variants' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <Layers className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">منتج بمتغيرات</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              للمنتجات التي لها أحجام، ألوان، أو مواصفات مختلفة (مثل الملابس، الإلكترونيات)
                            </p>
                          </div>
                          {productType === 'with_variants' && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control as any}
                      name="productType"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
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
                            name="merchantPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>سعر التاجر *</FormLabel>
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
                                        form.setValue('price', isNaN(numValue) ? undefined : numValue)
                                      }
                                      form.trigger(['merchantPrice', 'nubianMarkup'])
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  السعر الأساسي الذي تريد بيعه به
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control as any}
                            name="nubianMarkup"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>هامش ربح نوبيان (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="10"
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
                                      form.trigger(['merchantPrice', 'nubianMarkup'])
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  نسبة هامش الربح الافتراضية (10% افتراضي)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Pricing Preview */}
                        <PricingPreview
                          merchantPrice={form.watch('merchantPrice') || form.watch('price') || 0}
                          nubianMarkup={form.watch('nubianMarkup') || 10}
                          dynamicMarkup={0}
                          isMerchantView={true}
                        />

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
                            <p className="text-muted-foreground text-sm">
                              قم بتعريف الخصائص التي سيتم استخدامها في المتغيرات (مثل: الحجم، اللون، المادة)
                            </p>
                          </CardHeader>
                          <CardContent>
                            <AttributeDefinitionManager
                              attributes={attributes || []}
                              onChange={(attrs) => {
                                const normalized = (attrs || []).map((a) => ({
                                  ...a,
                                  type: a?.type ?? "select",
                                  required: a?.required ?? false,
                                  options: a?.options ?? [],
                                }));
                                form.setValue("attributes", normalized, { shouldValidate: false });
                              }}
                            />
                          </CardContent>
                        </Card>

                        {attributes && attributes.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>المتغيرات</CardTitle>
                              <p className="text-muted-foreground text-sm">
                                قم بإضافة المتغيرات للمنتج بناءً على الخصائص المعرفة
                              </p>
                            </CardHeader>
                            <CardContent>
                              <VariantManager
                                attributes={attributes || []}
                                variants={memoizedVariants}
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
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">صور المنتج</h3>
                    </div>
                    
                    <div className="bg-muted/30 p-6 rounded-xl border-2 border-dashed">
                      <Label className="mb-4 block text-center font-medium">قم برفع صور المنتج (صورة واحدة على الأقل) *</Label>
                      <ImageUpload 
                        onUploadComplete={handleUploadDone} 
                        initialUrls={form.getValues('images')}
                      />
                      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Info className="w-4 h-4" />
                        <span>يُنصح برفع صور واضحة وذات خلفية بيضاء لأفضل النتائج.</span>
                      </div>
                      
                      {images && images.length > 0 && (
                        <div className="mt-6">
                          <Separator className="mb-4" />
                          <div className="flex justify-between items-center px-2">
                            <span className="text-sm font-medium">عدد الصور المختارة:</span>
                            <Badge variant="secondary">{images.length}</Badge>
                          </div>
                        </div>
                      )}
                      
                      {form.formState.errors.images && (
                        <p className="text-sm font-medium text-destructive mt-4 text-center">
                          {form.formState.errors.images.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">مراجعة معلومات المنتج</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left: Product Images Preview */}
                      <div className="md:col-span-1 space-y-4">
                        <div className="aspect-square rounded-xl border bg-muted/30 overflow-hidden relative group">
                          {images && images.length > 0 ? (
                            <img 
                              src={images[0]} 
                              alt="Product Preview" 
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                              <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                              <span className="text-xs">لا توجد صور</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-black/50 backdrop-blur-sm border-none">الرئيسية</Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          {images?.slice(1, 5).map((img, i) => (
                            <div key={i} className="aspect-square rounded-lg border overflow-hidden">
                              <img src={img} alt={`Preview ${i+2}`} className="object-cover w-full h-full" />
                            </div>
                          ))}
                          {images && images.length > 5 && (
                            <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center text-xs font-bold">
                              +{images.length - 5}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Product Details */}
                      <div className="md:col-span-2 space-y-6">
                        <div className="rounded-xl border p-6 bg-card space-y-4 shadow-sm">
                          <div className="flex justify-between items-start border-b pb-4">
                            <div className="space-y-1">
                              <h4 className="text-2xl font-bold">{form.getValues('name') || 'اسم غير محدد'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {categories.find(c => c._id === form.getValues('category'))?.name || 'فئة غير محددة'}
                              </p>
                            </div>
                            <Badge variant={form.getValues('isActive') ? "success" : "secondary"}>
                              {form.getValues('isActive') ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider">نوع المنتج</Label>
                              <div className="flex items-center gap-2">
                                {productType === 'simple' ? <Package className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                <p className="font-semibold">{productType === 'simple' ? 'منتج بسيط' : 'منتج بمتغيرات'}</p>
                              </div>
                            </div>

                            {productType === 'simple' && (
                              <>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">السعر النهائي</Label>
                                  <p className="text-xl font-bold text-primary">
                                    {(form.getValues('merchantPrice') || form.getValues('price') || 0) * (1 + (form.getValues('nubianMarkup') || 10) / 100)} ج.س
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">يشمل هامش ربح نوبيان ({form.getValues('nubianMarkup') || 10}%)</p>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">المخزون المتوفر</Label>
                                  <p className={cn("text-lg font-bold", (form.getValues('stock') || 0) < 10 ? "text-destructive" : "text-foreground")}>
                                    {form.getValues('stock') ?? 0} قطعة
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="pt-4 border-t">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">الوصف</Label>
                            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 italic">
                              &quot;{form.getValues('description') || 'لا يوجد وصف متاح'}&quot;
                            </p>
                          </div>

                          {productType === 'with_variants' && (
                            <div className="pt-4 border-t space-y-4">
                              <div className="flex gap-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-muted-foreground">عدد الخصائص</span>
                                  <Badge variant="outline" className="w-fit">{(attributes || []).length} خصائص</Badge>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-muted-foreground">عدد المتغيرات</span>
                                  <Badge variant="outline" className="w-fit">{(variants || []).length} متغيرات</Badge>
                                </div>
                              </div>
                              
                              {/* Show variant image summary if any variant has images */}
                              {variants?.some(v => v.images && v.images.length > 0) && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">صور المتغيرات</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {variants.filter(v => v.images && v.images.length > 0).map((v, i) => (
                                      <div key={i} className="relative group">
                                        <img 
                                          src={v.images![0]} 
                                          className="w-10 h-10 rounded border object-cover" 
                                          alt={`Variant ${v.sku}`}
                                        />
                                        <div className="absolute -top-1 -right-1 bg-primary text-[8px] text-white rounded-full w-3 h-3 flex items-center justify-center">
                                          {v.images?.length}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          <p className="text-sm text-primary font-medium">كل شيء يبدو جيداً! يمكنك الآن الضغط على {isEdit ? 'تحديث' : 'إنشاء'} لحفظ المنتج.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center gap-4 pt-8 mt-8 border-t">
                  <div className="flex gap-3">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goToPreviousStep}
                        className="h-11 px-6 font-medium"
                      >
                        <ChevronRight className="w-4 h-4 ml-2" />
                        العودة للسابق
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push('/merchant/products')}
                      className="h-11 px-6 text-muted-foreground hover:text-foreground"
                    >
                      إلغاء العملية
                    </Button>
                  </div>
                  
                  <div className="flex gap-3">
                    {currentStep < maxStep ? (
                      <Button
                        type="submit"
                        onClick={(e) => {
                          e.preventDefault()
                          goToNextStep()
                        }}
                        className="h-11 px-8 font-bold shadow-lg shadow-primary/20"
                      >
                        الاستمرار للخطوة التالية
                        <ChevronLeft className="w-4 h-4 mr-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={loading || isSubmittingRef.current}
                        className="h-11 px-10 font-bold shadow-lg shadow-primary/30 min-w-[160px]"
                      >
                        {loading || isSubmittingRef.current ? (
                          <>
                            <span className="animate-spin ml-2">⏳</span>
                            جاري الحفظ...
                          </>
                        ) : isEdit ? 'تحديث المنتج النهائي' : 'إتمام إنشاء المنتج'}
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

