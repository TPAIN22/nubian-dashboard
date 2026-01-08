'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductAttribute } from '@/types/product.types'
import { Trash2, Plus } from 'lucide-react'

interface AttributeDefinitionManagerProps {
  attributes: ProductAttribute[]
  onChange: (attributes: ProductAttribute[]) => void
}

export function AttributeDefinitionManager({ attributes, onChange }: AttributeDefinitionManagerProps) {
  // Store temporary input values for adding options
  const [tempOptions, setTempOptions] = useState<Record<number, string>>({})
  const [bulkOptions, setBulkOptions] = useState<Record<number, string>>({})
  const addAttribute = () => {
    onChange([
      ...attributes,
      {
        name: '',
        displayName: '',
        type: 'select',
        required: false,
        options: []
      }
    ])
  }

  const updateAttribute = (index: number, updates: Partial<ProductAttribute>) => {
    const updated = [...attributes]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeAttribute = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index))
    // Clear all temporary state since indices will shift after removal
    // This is simpler and safer than trying to reindex
    setTempOptions({})
    setBulkOptions({})
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">خصائص المنتج (Attributes)</Label>
        <Button type="button" onClick={addAttribute} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          إضافة خاصية
        </Button>
      </div>
      
      {attributes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          لا توجد خصائص محددة. اضغط على &quot;إضافة خاصية&quot; لبدء إضافة خصائص المنتج (مثل الحجم، اللون، المادة، إلخ).
        </p>
      )}
      
      {attributes.map((attr, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">الاسم الداخلي (Internal Name) *</Label>
              <Input
                placeholder="مثال: size, color, material"
                value={attr.name}
                onChange={(e) => updateAttribute(index, { name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">يُستخدم في الكود (بالإنجليزية، بدون مسافات)</p>
            </div>
            <div>
              <Label className="text-sm">اسم العرض (Display Name) *</Label>
              <Input
                placeholder="مثال: الحجم، اللون، المادة"
                value={attr.displayName}
                onChange={(e) => updateAttribute(index, { displayName: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">الاسم الذي يراه المستخدم</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">نوع الخاصية (Type) *</Label>
              <Select
                value={attr.type}
                onValueChange={(value: 'select' | 'text' | 'number') => 
                  updateAttribute(index, { type: value, options: value === 'select' ? [] : undefined })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">قائمة منسدلة (Select)</SelectItem>
                  <SelectItem value="text">نص حر (Text)</SelectItem>
                  <SelectItem value="number">رقم (Number)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={attr.required}
                  onChange={(e) => updateAttribute(index, { required: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">مطلوب (Required)</span>
              </label>
            </div>
          </div>
          
          {attr.type === 'select' && (
            <div className="space-y-2">
              <Label className="text-sm">الخيارات المتاحة (Options) *</Label>
              <div className="space-y-2">
                {/* Display existing options */}
                {attr.options && attr.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                    {attr.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-background border rounded-md text-sm"
                      >
                        <span>{option}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedOptions = attr.options?.filter((_, i) => i !== optIndex) || []
                            updateAttribute(index, { options: updatedOptions })
                          }}
                          className="text-destructive hover:text-destructive/80 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Input field for adding new options */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="أدخل خياراً جديداً واضغط Enter أو اضغط إضافة"
                    value={tempOptions[index] || ''}
                    onChange={(e) => {
                      setTempOptions({ ...tempOptions, [index]: e.target.value })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        e.preventDefault()
                        const newOption = e.currentTarget.value.trim()
                        const existingOptions = attr.options || []
                        if (!existingOptions.includes(newOption)) {
                          updateAttribute(index, { 
                            options: [...existingOptions, newOption]
                          })
                        }
                        // Clear input
                        setTempOptions({ ...tempOptions, [index]: '' })
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const tempOption = tempOptions[index]
                      if (tempOption && tempOption.trim()) {
                        const newOption = tempOption.trim()
                        const existingOptions = attr.options || []
                        if (!existingOptions.includes(newOption)) {
                          updateAttribute(index, { 
                            options: [...existingOptions, newOption]
                          })
                        }
                        // Clear input
                        setTempOptions({ ...tempOptions, [index]: '' })
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    إضافة
                  </Button>
                </div>
                {/* Alternative: Textarea for bulk entry */}
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    أو أدخل خيارات متعددة في سطر منفصل لكل خيار
                  </summary>
                  <Textarea
                    placeholder="اكتب كل خيار في سطر منفصل&#10;مثال:&#10;S&#10;M&#10;L&#10;XL"
                    value={bulkOptions[index] || ''}
                    onChange={(e) => {
                      setBulkOptions({ ...bulkOptions, [index]: e.target.value })
                    }}
                    onBlur={(e) => {
                      const bulkText = e.target.value
                      if (bulkText.trim()) {
                        const newOptions = bulkText
                          .split('\n')
                          .map(o => o.trim())
                          .filter(o => o.length > 0)
                          .filter((o, i, arr) => arr.indexOf(o) === i) // Remove duplicates
                        const existingOptions = attr.options || []
                        const allOptions = [...new Set([...existingOptions, ...newOptions])] // Merge and deduplicate
                        updateAttribute(index, { 
                          options: allOptions
                        })
                        // Clear bulk input
                        setBulkOptions({ ...bulkOptions, [index]: '' })
                      }
                    }}
                    rows={3}
                    className="mt-2 font-mono text-sm"
                  />
                </details>
                <p className="text-xs text-muted-foreground">
                  {attr.options?.length || 0} خيار محدد
                  {attr.options && attr.options.length === 0 && (
                    <span className="text-destructive"> - يجب إضافة خيار واحد على الأقل</span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => removeAttribute(index)}
            className="w-full md:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            حذف الخاصية
          </Button>
        </div>
      ))}
    </div>
  )
}
