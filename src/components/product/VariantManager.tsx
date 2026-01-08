'use client'

import { useMemo } from 'react'
import { ProductAttribute, ProductVariant } from '@/types/product.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Trash2, Plus } from 'lucide-react'

interface VariantManagerProps {
  attributes: ProductAttribute[]
  variants: ProductVariant[]
  onChange: (variants: ProductVariant[]) => void
}

export function VariantManager({ attributes, variants, onChange }: VariantManagerProps) {
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
        price: 0,
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
      price: 0,
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

  return (
    <div className="space-y-4">
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
          لا توجد متغيرات محددة. استخدم "إنشاء جميع التركيبات" لإنشاء متغيرات تلقائياً من الخصائص، أو أضف متغيرات يدوياً.
        </p>
      )}
      
      {variants.map((variant, index) => {
        const variantAttrs = variant.attributes instanceof Map 
          ? Object.fromEntries(variant.attributes) 
          : variant.attributes || {}
        
        return (
          <div key={index} className="border rounded-lg p-4 space-y-3 bg-card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(variantAttrs).map(([key, value]) => {
                    const attr = attributes.find(a => a.name === key)
                    return (
                      <Badge key={key} variant="secondary">
                        {attr?.displayName || key}: {value}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">رمز SKU *</Label>
                <Input
                  placeholder="مثال: PROD-RED-L"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, { sku: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">السعر *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={variant.price || 0}
                  onChange={(e) => updateVariant(index, { price: parseFloat(e.target.value) || 0 })}
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
              <div>
                <Label className="text-sm">سعر الخصم (اختياري)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={variant.discountPrice || ''}
                  onChange={(e) => updateVariant(index, { 
                    discountPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* Allow setting attribute values for this variant */}
            {attributes.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm">قيم الخصائص لهذا المتغير:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attributes.map(attr => {
                    if (attr.type === 'select' && attr.options) {
                      return (
                        <div key={attr.name}>
                          <Label className="text-xs">{attr.displayName}</Label>
                          <select
                            value={variantAttrs[attr.name] || ''}
                            onChange={(e) => updateVariantAttribute(index, attr.name, e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                          >
                            <option value="">-- اختر --</option>
                            {attr.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      )
                    } else if (attr.type === 'text') {
                      return (
                        <div key={attr.name}>
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
                        <div key={attr.name}>
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
