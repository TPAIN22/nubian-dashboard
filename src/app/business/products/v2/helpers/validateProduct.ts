import { WizardState } from "../types";
import { ProductAttributeDefDTO } from "@/domain/product/product.types";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>; // path -> message
}

export function validateStep1(state: WizardState): ValidationResult {
  const errors: Record<string, string> = {};

  if (!state.name.trim()) errors["name"] = "اسم المنتج مطلوب";
  if (!state.description.trim()) errors["description"] = "الوصف مطلوب";
  if (!state.category) errors["category"] = "الفئة مطلوبة";
  
  if (state.images.length === 0) {
    errors["images"] = "يجب رفع صورة واحدة على الأقل";
  }

  // If simple product, check price/stock here or later? 
  // User flow: Step 1 is Basic Info. 
  // If simple, user might set price/stock in Step 1 or a dedicated step.
  // The plan says "Step 2: Variants Setup (Support SIMPLE PRODUCT)".
  // So validation for price/stock comes later.

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep2(state: WizardState): ValidationResult {
  const errors: Record<string, string> = {};

  if (state.productType === "with_variants") {
    // Must have at least one attribute
    if (state.attributes.length === 0) {
      errors["attributes"] = "يجب إضافة خيارات (مثل اللون أو المقاس)";
    }
    
    // Check attributes have options
    state.attributes.forEach((attr, idx) => {
      if (!attr.name.trim()) {
        errors[`attributes.${idx}.name`] = "اسم الخاصية مطلوب";
      }
      if (!attr.options || attr.options.length === 0) {
        errors[`attributes.${idx}.options`] = "يجب إضافة قيم للخاصية";
      }
    });

    // Validating generated variants?
    if (state.variants.length === 0 && state.attributes.length > 0) {
       // This might happen if generation failed or wasn't triggered
       errors["variants"] = "لم يتم إنشاء أي متغيرات";
    }
  } else {
    // Simple Product
    // validate price/stock if they are in this step?
    // Plan said: Step 2 Support SIMPLE PRODUCT.
    // If simple product inputs are in Step 2, validate them.
    if (state.price === undefined || state.price < 0) {
      errors["price"] = "السعر مطلوب";
    }
    if (state.stock === undefined || state.stock < 0) {
      errors["stock"] = "المخزون مطلوب";
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep3(state: WizardState): ValidationResult {
  // Step 3: Matrix (Stock)
  const errors: Record<string, string> = {};

  if (state.productType === "with_variants") {
    // Check if any variant has negative stock?
    // Or if stock is required? usually yes.
    state.variants.forEach((v) => {
      if (v.stock < 0) {
         errors[`variant.${v.sku}.stock`] = "المخزون لا يمكن أن يكون سالباً";
      }
    });
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep4(state: WizardState): ValidationResult {
  // Step 4: Color Images
  const errors: Record<string, string> = {};
  
  if (state.productType === "with_variants") {
     // Find color attribute
     const colorAttr = state.attributes.find(a => a.name.toLowerCase() === 'color' || a.name === 'اللون');
     if (colorAttr && colorAttr.options) {
        colorAttr.options.forEach(color => {
           const images = state.colorImages[color];
           if (!images || images.length === 0) {
             errors[`color.${color}`] = `يجب رفع صورة للون: ${color}`;
           }
        });
     }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep5(state: WizardState): ValidationResult {
  // Step 5: Pricing
  // Usually optional per color, but at least valid numbers.
  const errors: Record<string, string> = {};
  
  // Nothing hard required unless we enforce price > 0
  if (state.productType === "with_variants") {
    state.variants.forEach(v => {
       if (v.merchantPrice < 0) {
         errors[`variant.${v.sku}.price`] = "السعر لا يمكن أن يكون سالباً";
       }
    });
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
