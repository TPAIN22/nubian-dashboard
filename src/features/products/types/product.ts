export interface ProductVariant {
  _id: string;
  sku: string;
  attributes: Record<string, string>;
  merchantPrice: number;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  merchantDiscount?: number;
  finalPrice: number;
  stock: number;
  images: string[];
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  // Top-level pricing (derived from best variant by controller)
  price?: number;
  discountPrice?: number;
  merchantPrice?: number;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  finalPrice?: number;
  // Total active stock (derived from variants by controller/virtual)
  stock?: number;
  isActive: boolean;
  images: string[];
  // Variant-first architecture
  variants: ProductVariant[];
  category?: {
    _id: string;
    name: string;
  } | string;
  merchant?: {
    _id: string;
    businessName: string;
    businessEmail: string;
    status?: string;
  };
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Admin-controlled ranking fields (top-level on schema)
  priorityScore?: number;
  featured?: boolean;
  averageRating?: number;
  status?: 'active' | 'draft' | 'archived';
}

export interface ProductFilters {
  category?: string;
  merchant?: string;
  isActive?: string;
  includeDeleted?: string; // 'true' | 'false'
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}
