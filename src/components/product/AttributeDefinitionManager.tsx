'use client'

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
          لا توجد خصائص محددة. اضغط على "إضافة خاصية" لبدء إضافة خصائص المنتج (مثل الحجم، اللون، المادة، إلخ).
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
            <div>
              <Label className="text-sm">الخيارات المتاحة (Options) *</Label>
              <Textarea
                placeholder="اكتب كل خيار في سطر منفصل&#10;مثال:&#10;S&#10;M&#10;L&#10;XL"
                value={attr.options?.join('\n') || ''}
                onChange={(e) => {
                  const options = e.target.value.split('\n')
                    .map(o => o.trim())
                    .filter(o => o.length > 0)
                  updateAttribute(index, { options })
                }}
                rows={4}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {attr.options?.length || 0} خيار محدد
              </p>
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
