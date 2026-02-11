import { ProductAttributeDefDTO, ProductVariantDTO } from "@/domain/product/product.types";

export type ProductType = "simple" | "with_variants";

export interface WizardState {
  // Basic Info
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  images: string[];
  productType: ProductType;

  // Simple Product Fields
  price?: number; // legacy/merchantPrice mirror
  stock?: number;
  
  // Variant Config
  attributes: ProductAttributeDefDTO[];
  
  // The Source of Truth for Variants
  // We keep a flat list, but the UI might pivot it.
  variants: ProductVariantDTO[];

  // Helper state for the UI (not sent to DB directly, but applied to variants)
  // Color Images: map color name -> images[]
  colorImages: Record<string, string[]>;
  
  // Pricing: map color name -> price
  colorPrices: Record<string, number>;
}

export const INITIAL_WIZARD_STATE: WizardState = {
  name: "",
  description: "",
  category: "",
  isActive: true,
  images: [],
  productType: "simple", // default, user must select
  attributes: [],
  variants: [],
  colorImages: {},
  colorPrices: {},
};
