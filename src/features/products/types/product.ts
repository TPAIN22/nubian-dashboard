export interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice: number;
  merchantPrice?: number;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  finalPrice?: number;
  stock: number;
  isActive: boolean;
  description: string;
  images: string[];
  sizes: string[];
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
  // Ranking fields (admin-controlled)
  priorityScore?: number;
  featured?: boolean;
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
