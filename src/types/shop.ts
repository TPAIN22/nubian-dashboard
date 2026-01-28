export type ObjectIdString = string;

// --- PRODUCT TYPES (from domain/product/product.types.ts) ---

export type ProductAttributeType = "select" | "text" | "number";

export type ProductAttributeDefDTO = {
  _id: ObjectIdString;
  name: string;
  displayName: string;
  type?: ProductAttributeType;
  required?: boolean;
  options?: string[];
};

export type ProductVariantDTO = {
  _id: ObjectIdString;
  sku: string;
  attributes: Record<string, string>;
  merchantPrice: number;
  price: number;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  finalPrice?: number;
  discountPrice?: number;
  stock: number;
  images?: string[];
  isActive?: boolean;
};

export type ProductCategoryDTO =
  | ObjectIdString
  | {
      _id: ObjectIdString;
      name?: string;
      parent?: ObjectIdString | { _id: ObjectIdString; name?: string } | null;
    };

export type ProductDTO = {
  _id: ObjectIdString;
  name: string;
  description: string;
  merchantPrice?: number;
  price?: number;
  stock?: number;
  nubianMarkup?: number;
  dynamicMarkup?: number;
  finalPrice?: number;
  discountPrice?: number;
  sizes?: string[];
  colors?: string[];
  attributes?: ProductAttributeDefDTO[];
  variants?: ProductVariantDTO[];
  isActive?: boolean;
  priorityScore?: number;
  featured?: boolean;
  category: ProductCategoryDTO;
  images: string[];
  averageRating?: number;
  reviews?: ObjectIdString[];
  merchant?: ObjectIdString | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// --- CART TYPES (from types/cart.types.ts) ---

export type SelectedAttributes = Record<string, string>;

export interface CartItem {
  product: ProductDTO;
  quantity: number;
  size?: string;
  attributes?: SelectedAttributes;
  _id?: string;
}

export interface Cart {
  _id?: string;
  user?: string;
  products: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  size?: string;
  attributes?: SelectedAttributes;
}

export interface UpdateCartItemRequest {
  productId: string;
  quantity: number;
  size?: string;
  attributes?: SelectedAttributes;
}

export interface RemoveFromCartRequest {
  productId: string;
  size?: string;
  attributes?: SelectedAttributes;
}

// --- CHECKOUT / ORDER TYPES (from types/checkout.types.ts) ---

export type PaymentMethod = "CASH" | "BANKAK";
export type PaymentStatus = "PENDING" | "AWAITING_VERIFICATION" | "VERIFIED" | "REJECTED";
export type FulfillmentStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface Address {
  _id?: string;
  userId?: string;
  name: string;
  city: string;
  area: string;
  street: string;
  building?: string;
  phone: string;
  whatsapp: string;
  notes?: string;
  isDefault: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  merchantId: string;
  image?: string;
  attributes?: Record<string, string>;
}

export interface SubOrder {
  _id?: string;
  parentOrderId?: string;
  merchantId: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
}

export interface Order {
  _id?: string;
  userId?: string;
  address: Address;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingFee: number;
  subtotal: number;
  total: number;
  currency: string;
  proofUrl?: string;
  subOrders: SubOrder[];
  status: "PLACED" | "PAID" | "REJECTED";
  createdAt?: string;
}

export interface CreateOrderRequest {
  address: {
    name: string;
    city: string;
    area: string;
    street: string;
    phone: string;
    whatsapp: string;
  };
  paymentMethod: PaymentMethod;
  cartId?: string; // Optional if using server-side cart
  items?: AddToCartRequest[]; // Optional if sending items directly
}
