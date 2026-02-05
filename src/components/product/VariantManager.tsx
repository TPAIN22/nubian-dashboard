'use client'

import { useMemo } from 'react'
import { ProductAttribute, ProductVariant } from '@/types/product.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Trash2, Plus, Image as ImageIcon, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import ImageUpload from '@/components/imageUpload'
import { getResolvedVariantPrice, FormVariant } from '@/lib/products/normalizeProductPayload'

interface VariantManagerProps {
  attributes: ProductAttribute[]
  variants: ProductVariant[]
  onChange: (variants: ProductVariant[]) => void
  // New props for default pricing
  defaultVariantMerchantPrice?: number | ""
  onDefaultPriceChange?: (price: number | "") => void
  samePriceForAllVariants?: boolean
  onSamePriceToggle?: (enabled: boolean) => void
  defaultNubianMarkup?: number
}

export function VariantManager({ 
  attributes, 
  variants, 
  onChange,
  defaultVariantMerchantPrice,
  onDefaultPriceChange,
  samePriceForAllVariants = false,
  onSamePriceToggle,
  defaultNubianMarkup = 10,
}: VariantManagerProps) {
  // Generate all possible variant combinations from attributes
  const generateVariants = () => {
    if (attributes.length === 0) {
      alert('يرجى إضافة خصائص أولاً')
      return
    }

    // Validate all attributes have options
    const selectAttributes = attributes.filter(a => a.type === 'select')
    if (selectAttributes.some(a => !a.options || a.options.length === 0)) {
      alert('يرجى إضافة خيارات لجميع الخصائص من نوع "قائمة منسدلة"')
      return
    }

    // Generate all combinations
    const combinations: Record<string, string>[] = []
    
    function generateCombinations(index: number, current: Record<string, string>) {
      if (index === attributes.length) {
        combinations.push({ ...current })
        return
      }
      
      const attr = attributes[index]
      if (attr.type === 'select' && attr.options) {
        attr.options.forEach(option => {
          generateCombinations(index + 1, { ...current, [attr.name]: option })
        })
      } else {
        // For text/number attributes, skip (user will add manually)
        generateCombinations(index + 1, current)
      }
    }
    
    generateCombinations(0, {})
    
    // Create variants from combinations
    const newVariants: ProductVariant[] = combinations.map(combo => {
      // Generate SKU from combination
      const skuParts = Object.entries(combo)
        .map(([key, value]) => value.toUpperCase().replace(/\s+/g, '-'))
      const sku = `PROD-${skuParts.join('-')}`
      
      // Check if variant already exists with same attributes
      const existing = variants.find(v => {
        const vAttrs = v.attributes instanceof Map 
          ? Object.fromEntries(v.attributes) 
          : v.attributes
        return Object.keys(combo).every(key => vAttrs[key] === combo[key]) &&
               Object.keys(vAttrs).length === Object.keys(combo).length
      })
      
        if (existing) {
        return existing
      }
      
      return {
        sku,
        attributes: combo,
        // Leave merchantPrice undefined/empty to use default
        merchantPrice: undefined as any,
        price: undefined as any,
        nubianMarkup: defaultNubianMarkup,
        stock: 0,
        isActive: true
      }
    })
    
    onChange([...variants, ...newVariants])
  }

  const addManualVariant = () => {
    const newVariant: ProductVariant = {
      sku: '',
      attributes: {},
      // Leave merchantPrice undefined/empty to use default
      merchantPrice: undefined as any,
      price: undefined as any,
      nubianMarkup: defaultNubianMarkup,
      stock: 0,
      isActive: true
    }
    onChange([...variants, newVariant])
  }

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index))
  }

  const updateVariantAttribute = (index: number, attrName: string, value: string) => {
    const variant = variants[index]
    const attrs = variant.attributes instanceof Map 
      ? Object.fromEntries(variant.attributes) 
      : { ...variant.attributes }
    
    if (value) {
      attrs[attrName] = value
    } else {
      delete attrs[attrName]
    }
    
    updateVariant(index, { attributes: attrs })
  }

  // Get price status for a variant
  const getPriceStatus = (variant: ProductVariant) => {
    const formVariant: FormVariant = {
      sku: variant.sku,
      attributes: variant.attributes instanceof Map 
        ? Object.fromEntries(variant.attributes) 
        : variant.attributes || {},
      merchantPrice: variant.merchantPrice,
      nubianMarkup: variant.nubianMarkup,
      stock: variant.stock,
      isActive: variant.isActive,
      images: variant.images,
    }
    return getResolvedVariantPrice(formVariant, defaultVariantMerchantPrice)
  }

  // Count variants without explicit price
  const variantsWithoutPrice = useMemo(() => {
    return variants.filter(v => {
      const price = v.merchantPrice
      return price === undefined || price === null || price === 0 || price === '' as any
    }).length
  }, [variants])

  const hasDefaultPrice = typeof defaultVariantMerchantPrice === 'number' && defaultVariantMerchantPrice > 0

  return (
    <div className="space-y-4">
      {/* Default Price Section */}
      {onDefaultPriceChange && (
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-semibold">إعدادات التسعير للمتغيرات</Label>
              <p className="text-sm text-muted-foreground">
                يمكنك تعيين سعر افتراضي يُطبق على المتغيرات التي ليس لها سعر محدد
              </p>
            </div>
          </div>
          
          {onSamePriceToggle && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <Label className="font-medium">نفس السعر لجميع المتغيرات</Label>
                <p className="text-xs text-muted-foreground">
                  {samePriceForAllVariants 
                    ? "سيتم استخدام السعر الافتراضي لجميع المتغيرات" 
                    : "يمكنك تحديد سعر مختلف لكل متغير"}
                </p>
              </div>
              <Switch
                checked={samePriceForAllVariants}
                onCheckedChange={onSamePriceToggle}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">
                السعر الافتراضي للمتغيرات {samePriceForAllVariants && <span className="text-destructive">*</span>}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={defaultVariantMerchantPrice === "" ? "" : defaultVariantMerchantPrice || ""}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "") {
                    onDefaultPriceChange("")
                  } else {
                    const numValue = parseFloat(value)
                    onDefaultPriceChange(isNaN(numValue) ? "" : numValue)
                  }
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                يُطبق على المتغيرات التي ليس لها سعر مخصص
              </p>
            </div>
          </div>
          
          {/* Status summary */}
          {variants.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {variantsWithoutPrice > 0 && (
                <Badge variant={hasDefaultPrice ? "secondary" : "destructive"} className="gap-1">
                  {hasDefaultPrice ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      {variantsWithoutPrice} متغيرات ستستخدم السعر الافتراضي
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      {variantsWithoutPrice} متغيرات بدون سعر
                    </>
                  )}
                </Badge>
              )}
              {variants.length - variantsWithoutPrice > 0 && (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {variants.length - variantsWithoutPrice} متغيرات بسعر مخصص
                </Badge>
              )}
            </div>
          )}
          
          {/* Warning if no default price and variants without price */}
          {variantsWithoutPrice > 0 && !hasDefaultPrice && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                يوجد {variantsWithoutPrice} متغيرات بدون سعر. يرجى تعيين سعر افتراضي أو إدخال سعر لكل متغير.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center flex-wrap gap-2">
        <Label className="text-base font-semibold">متغيرات المنتج (Variants)</Label>
        <div className="flex gap-2">
          {attributes.length > 0 && (
            <Button type="button" onClick={generateVariants} size="sm" variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              إنشاء جميع التركيبات
            </Button>
          )}
          <Button type="button" onClick={addManualVariant} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            إضافة متغير يدوياً
          </Button>
        </div>
      </div>
      
      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
          لا توجد متغيرات محددة. استخدم &quot;إنشاء جميع التركيبات&quot; لإنشاء متغيرات تلقائياً من الخصائص، أو أضف متغيرات يدوياً.
        </p>
      )}
      
      {variants.map((variant, index) => {
        const variantAttrs = variant.attributes instanceof Map 
          ? Object.fromEntries(variant.attributes) 
          : variant.attributes || {}
        
        const priceStatus = getPriceStatus(variant)
        const showPriceInput = !samePriceForAllVariants
        // Generate a unique key for the variant
        const variantKey = variant.sku || variant._id || `variant-${index}`
        
        return (
          <div key={variantKey} className="border rounded-lg p-4 space-y-3 bg-card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(variantAttrs).map(([key, value], attrIndex) => {
                    const attr = attributes.find(a => a.name === key)
                    return (
                      <Badge key={key || `attr-${attrIndex}`} variant="secondary">
                        {attr?.displayName || key}: {String(value)}
                      </Badge>
                    )
                  })}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVariant(index)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">رمز SKU *</Label>
                <Input
                  placeholder="مثال: PROD-RED-L"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, { sku: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              {showPriceInput && (
                <div>
                  <Label className="text-sm">
                    سعر التاجر
                    <span className="text-muted-foreground text-xs mr-1">(اختياري)</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={hasDefaultPrice ? `افتراضي: ${defaultVariantMerchantPrice}` : "0.00"}
                    value={variant.merchantPrice || ""}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        updateVariant(index, { merchantPrice: undefined as any, price: undefined as any })
                      } else {
                        const val = parseFloat(value) || 0
                        updateVariant(index, { merchantPrice: val, price: val })
                      }
                    }}
                    className="mt-1"
                  />
                  {/* Price status indicator */}
                  <div className="mt-1">
                    {priceStatus.source === "custom" && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        سعر مخصص
                      </span>
                    )}
                    {priceStatus.source === "default" && (
                      <span className="text-xs text-blue-600 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        يستخدم السعر الافتراضي ({priceStatus.price})
                      </span>
                    )}
                    {priceStatus.source === "missing" && (
                      <span className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        السعر مطلوب (حدد سعر افتراضي أو سعر مخصص)
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-sm">هامش نوبيان (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="10"
                  value={variant.nubianMarkup ?? defaultNubianMarkup}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    updateVariant(index, { nubianMarkup: val })
                  }}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">المخزون *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={variant.stock || 0}
                  onChange={(e) => updateVariant(index, { stock: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                صور المتغير (اختياري)
              </Label>
              <ImageUpload 
                onUploadComplete={(urls) => updateVariant(index, { images: urls })}
                initialUrls={variant.images}
              />
              <p className="text-[10px] text-muted-foreground">
                يمكنك إضافة صور خاصة لهذا المتغير (مثل لون محدد). إذا لم تضف صوراً، سيتم استخدام صور المنتج الرئيسية.
              </p>
            </div>
            
            {/* Allow setting attribute values for this variant */}
            {attributes.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm">قيم الخصائص لهذا المتغير:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attributes.map((attr, attrIdx) => {
                    const attrKey = attr.name || `attr-field-${attrIdx}`
                    if (attr.type === 'select' && attr.options) {
                      return (
                        <div key={attrKey}>
                          <Label className="text-xs">{attr.displayName}</Label>
                          <select
                            value={variantAttrs[attr.name] || ''}
                            onChange={(e) => updateVariantAttribute(index, attr.name, e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                          >
                            <option value="">-- اختر --</option>
                            {attr.options.map((opt, optIdx) => (
                              <option key={opt || `opt-${optIdx}`} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      )
                    } else if (attr.type === 'text') {
                      return (
                        <div key={attrKey}>
                          <Label className="text-xs">{attr.displayName}</Label>
                          <Input
                            value={variantAttrs[attr.name] || ''}
                            onChange={(e) => updateVariantAttribute(index, attr.name, e.target.value)}
                            className="mt-1 text-sm"
                            placeholder={`أدخل ${attr.displayName}`}
                          />
                        </div>
                      )
                    } else if (attr.type === 'number') {
                      return (
                        <div key={attrKey}>
                          <Label className="text-xs">{attr.displayName}</Label>
                          <Input
                            type="number"
                            value={variantAttrs[attr.name] || ''}
                            onChange={(e) => updateVariantAttribute(index, attr.name, e.target.value)}
                            className="mt-1 text-sm"
                            placeholder={`أدخل ${attr.displayName}`}
                          />
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t">
              <input
                type="checkbox"
                id={`variant-active-${index}`}
                checked={variant.isActive !== false}
                onChange={(e) => updateVariant(index, { isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor={`variant-active-${index}`} className="text-sm cursor-pointer">
                متغير نشط (Active)
              </Label>
            </div>
          </div>
        )
      })}
    </div>
  )
}
