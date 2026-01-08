# Frontend Form Implementation Guide

## Overview

This guide provides step-by-step instructions for updating the product creation forms to support the new variant system.

---

## Current State

### Issues to Fix

1. **Merchant Form** (`src/app/merchant/products/new/productForm.tsx`)
   - ❌ No variant management UI
   - ❌ No attribute definition UI
   - ❌ Hardcoded size options
   - ✅ Has basic validation

2. **Admin Form** (`src/app/business/products/new/productForm.tsx`)
   - ❌ Has "brand" field (doesn't exist in model) - **REMOVE THIS**
   - ❌ Stock field is string (should be number)
   - ❌ No variant management UI
   - ❌ No attribute definition UI
   - ⚠️ Different validation schema than merchant form

---

## Implementation Steps

### Step 1: Update Form Schema

**Current Schema:**
```typescript
const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  discountPrice: z.number().min(0).optional(),
  category: z.string().min(1, 'Category is required'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  sizes: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  isActive: z.boolean().optional(),
})
```

**Updated Schema:**
```typescript
import { ProductAttribute, ProductVariant } from '@/types/product.types'

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  
  // Product type: 'simple' or 'with_variants'
  productType: z.enum(['simple', 'with_variants']),
  
  // For simple products
  price: z.number().min(0.01).optional(),
  discountPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  
  // For variant-based products
  attributes: z.array(z.object({
    name: z.string().min(1),
    displayName: z.string().min(1),
    type: z.enum(['select', 'text', 'number']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).optional(),
  
  variants: z.array(z.object({
    sku: z.string().min(1, 'SKU is required'),
    attributes: z.record(z.string()),
    price: z.number().min(0.01),
    discountPrice: z.number().min(0).optional(),
    stock: z.number().int().min(0),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  })).optional(),
  
  // Legacy fields (for backward compatibility)
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  
  isActive: z.boolean().optional(),
}).refine((data) => {
  // If simple product, price and stock are required
  if (data.productType === 'simple') {
    return data.price !== undefined && data.stock !== undefined
  }
  // If variant product, attributes and variants are required
  if (data.productType === 'with_variants') {
    return data.attributes !== undefined && 
           data.attributes.length > 0 &&
           data.variants !== undefined &&
           data.variants.length > 0
  }
  return true
}, {
  message: 'Invalid product configuration',
  path: ['productType']
})
```

### Step 2: Add Product Type Selector

Add a radio/select to choose product type:

```tsx
<FormField
  control={form.control}
  name="productType"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Product Type *</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select product type" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="simple">Simple Product (No Variants)</SelectItem>
          <SelectItem value="with_variants">Product with Variants</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Step 3: Conditionally Show Fields

Show price/stock only for simple products:

```tsx
{form.watch('productType') === 'simple' && (
  <>
    <FormField
      control={form.control}
      name="price"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Price *</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
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
      name="stock"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Stock *</FormLabel>
          <FormControl>
            <Input
              type="number"
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </>
)}
```

### Step 4: Add Attribute Definition UI

Create a component for managing attributes:

```tsx
// AttributeDefinitionManager.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductAttribute } from '@/types/product.types'

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
        <Label>Product Attributes</Label>
        <Button type="button" onClick={addAttribute} size="sm">
          Add Attribute
        </Button>
      </div>
      
      {attributes.map((attr, index) => (
        <div key={index} className="border p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Internal Name *</Label>
              <Input
                placeholder="e.g., size, color, material"
                value={attr.name}
                onChange={(e) => updateAttribute(index, { name: e.target.value })}
              />
            </div>
            <div>
              <Label>Display Name *</Label>
              <Input
                placeholder="e.g., Size, Color, Material"
                value={attr.displayName}
                onChange={(e) => updateAttribute(index, { displayName: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type *</Label>
              <Select
                value={attr.type}
                onValueChange={(value: 'select' | 'text' | 'number') => 
                  updateAttribute(index, { type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select (Dropdown)</SelectItem>
                  <SelectItem value="text">Text (Free Input)</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={attr.required}
                  onChange={(e) => updateAttribute(index, { required: e.target.checked })}
                />
                <span>Required</span>
              </label>
            </div>
          </div>
          
          {attr.type === 'select' && (
            <div>
              <Label>Options (one per line) *</Label>
              <Textarea
                placeholder="S&#10;M&#10;L&#10;XL"
                value={attr.options?.join('\n') || ''}
                onChange={(e) => {
                  const options = e.target.value.split('\n').filter(o => o.trim())
                  updateAttribute(index, { options })
                }}
                rows={4}
              />
            </div>
          )}
          
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => removeAttribute(index)}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  )
}
```

### Step 5: Add Variant Management UI

Create a component for managing variants:

```tsx
// VariantManager.tsx
'use client'

import { useMemo } from 'react'
import { ProductAttribute, ProductVariant } from '@/types/product.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VariantManagerProps {
  attributes: ProductAttribute[]
  variants: ProductVariant[]
  onChange: (variants: ProductVariant[]) => void
}

export function VariantManager({ attributes, variants, onChange }: VariantManagerProps) {
  // Generate all possible variant combinations
  const generateVariants = () => {
    if (attributes.length === 0) return

    // Get all attribute combinations
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
      }
    }
    
    generateCombinations(0, {})
    
    // Create variants from combinations
    const newVariants: ProductVariant[] = combinations.map(combo => {
      // Generate SKU from combination
      const skuParts = Object.entries(combo)
        .map(([key, value]) => value.toUpperCase().replace(/\s+/g, '-'))
      const sku = `PRODUCT-${skuParts.join('-')}`
      
      // Check if variant already exists
      const existing = variants.find(v => 
        Object.keys(combo).every(key => v.attributes[key] === combo[key])
      )
      
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
    
    onChange(newVariants)
  }

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Product Variants</Label>
        <Button type="button" onClick={generateVariants} size="sm">
          Generate All Combinations
        </Button>
      </div>
      
      {variants.map((variant, index) => (
        <div key={index} className="border p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>SKU *</Label>
              <Input
                value={variant.sku}
                onChange={(e) => updateVariant(index, { sku: e.target.value })}
              />
            </div>
            <div>
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={variant.price}
                onChange={(e) => updateVariant(index, { price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div>
            <Label>Attributes</Label>
            <div className="space-y-2">
              {Object.entries(variant.attributes).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{key}:</span>
                  <span className="text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stock *</Label>
              <Input
                type="number"
                value={variant.stock}
                onChange={(e) => updateVariant(index, { stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={variant.isActive}
                  onChange={(e) => updateVariant(index, { isActive: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>
          </div>
          
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => removeVariant(index)}
          >
            Remove Variant
          </Button>
        </div>
      ))}
    </div>
  )
}
```

### Step 6: Update Form Submission

Update the `onSubmit` function to handle both product types:

```typescript
const onSubmit = async (values: z.infer<typeof formSchema>) => {
  const dataToSend: any = {
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category,
    images: values.images,
    isActive: values.isActive !== false,
  }

  if (values.productType === 'simple') {
    // Simple product
    dataToSend.price = values.price
    dataToSend.discountPrice = values.discountPrice || 0
    dataToSend.stock = values.stock
  } else {
    // Variant-based product
    dataToSend.attributes = values.attributes
    dataToSend.variants = values.variants?.map(v => ({
      ...v,
      discountPrice: v.discountPrice || 0,
      isActive: v.isActive !== false,
    }))
  }

  // Submit to API
  try {
    const token = await getToken()
    if (isEdit && productId) {
      await axiosInstance.put(`/products/${productId}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } else {
      await axiosInstance.post('/products', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
    toast.success('Product saved successfully')
    router.push('/merchant/products')
  } catch (error) {
    // Handle error
  }
}
```

### Step 7: Remove "brand" Field from Admin Form

**In `src/app/business/products/new/productForm.tsx`:**

1. Remove `brand` from form schema
2. Remove `brand` field from form UI
3. Remove `brand` from default values

---

## Testing Checklist

- [ ] Can create simple product
- [ ] Can create product with single attribute
- [ ] Can create product with multiple attributes
- [ ] Variant generation works correctly
- [ ] SKU validation works
- [ ] Price/stock validation works
- [ ] Form errors display correctly
- [ ] Edit existing product works
- [ ] Backward compatibility (edit old products)

---

## Additional Resources

- See `PRODUCT_SCHEMA_EXAMPLES.md` for API payload examples
- See `PRODUCT_OPTIMIZATION_SUMMARY.md` for complete overview
- See `src/types/product.types.ts` for TypeScript types
