// ─────────────────────────────────────────────────────────────
// Shared Types and Interfaces
// ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT_CONFIRMATION"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "PAYMENT_FAILED"
  // old
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "CASH" | "BANKAK" | "cash" | "card";

export type PaymentStatus =
  | "UNPAID"
  | "PENDING_CONFIRMATION"
  | "PAID"
  | "REJECTED"
  | "FAILED"
  // old
  | "pending"
  | "paid"
  | "failed";

export interface OrderItem {
  productId?: string;
  name?: string;
  quantity: number;
  price: number; // unit price at checkout time
  image?: string;
  attributes?: Record<string, any>;
  merchantId?: string;
}

export interface AddressSnapshot {
  name?: string;
  city?: string;
  area?: string;
  street?: string;
  building?: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
}

export interface Order {
  _id: string;

  // customer
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
  };

  // new
  items?: OrderItem[];
  subtotal?: number;
  shippingFee?: number;
  total?: number;
  currency?: string;

  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transferProof?: string;

  status: OrderStatus;
  orderNumber?: string;
  createdAt?: string;
  updatedAt?: string;

  addressSnapshot?: AddressSnapshot;

  // old fallback fields
  products?: any[];
  productsDetails?: { name: string; quantity: number; price: number }[];
  totalAmount?: number;
  finalAmount?: number;
  discountAmount?: number;
  couponDetails?: { code: string; discountAmount?: number };
  phoneNumber?: string;
  address?: string;
  city?: string;
  orderDate?: string;
  productsCount?: number;
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

const isUpper = (s?: string) => (s ? s === s.toUpperCase() : false);

export const getStatusInArabic = (status: string) => {
  const map: Record<string, string> = {
    // new
    PENDING: "بانتظار التأكيد",
    AWAITING_PAYMENT_CONFIRMATION: "بانتظار موافقة التحويل",
    CONFIRMED: "مؤكد",
    PROCESSING: "قيد التجهيز",
    SHIPPED: "تم الشحن",
    DELIVERED: "تم التسليم",
    CANCELLED: "ملغي",
    PAYMENT_FAILED: "فشل الدفع",

    // old
    pending: "بانتظار التأكيد",
    confirmed: "مؤكد",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
  };
  return map[status] || status;
};

export const getPaymentStatusInArabic = (s: string) => {
  const map: Record<string, string> = {
    UNPAID: "غير مدفوع",
    PENDING_CONFIRMATION: "بانتظار موافقة التحويل",
    PAID: "مدفوع",
    REJECTED: "مرفوض",
    FAILED: "فشل",

    pending: "بانتظار",
    paid: "مدفوع",
    failed: "فشل",
  };
  return map[s] || s;
};

export const getPaymentMethodArabic = (m?: string) => {
  const map: Record<string, string> = {
    CASH: "كاش",
    BANKAK: "بنكك",
    cash: "كاش",
    card: "بطاقة",
  };
  return m ? map[m] || m : "—";
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-SD", { year: "numeric", month: "short", day: "numeric" });
};

export const formatMoney = (amount?: number, currency = "SDG") => {
  const v = typeof amount === "number" && isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-SD", { minimumFractionDigits: 2 }).format(v);
  return `${formatted} ${currency === "SDG" ? "ج.س" : currency}`;
};

export const getOrderTotal = (o: Order) => {
  // prefer new
  if (typeof o.total === "number") return o.total;
  if (typeof o.finalAmount === "number") return o.finalAmount;
  if (typeof o.totalAmount === "number") return o.totalAmount;
  return 0;
};

export const getOrderSubtotal = (o: Order) => {
  if (typeof o.subtotal === "number") return o.subtotal;
  if (typeof o.totalAmount === "number") return o.totalAmount;
  return 0;
};

export const getItemsCount = (o: Order) => {
  if (Array.isArray(o.items)) return o.items.reduce((acc, it) => acc + (it.quantity ?? 0), 0);
  if (o.productsCount) return o.productsCount;
  if (Array.isArray(o.productsDetails)) return o.productsDetails.reduce((a, p) => a + (p.quantity ?? 0), 0);
  if (Array.isArray(o.products)) return o.products.reduce((a, p) => a + (p.quantity ?? 0), 0);
  return 0;
};

export const getCustomerName = (o: Order) => o.customerInfo?.name || "غير محدد";
export const getCustomerEmail = (o: Order) => o.customerInfo?.email || "غير محدد";
export const getCustomerPhone = (o: Order) => o.customerInfo?.phone || o.phoneNumber || "غير محدد";

export const getAddressText = (o: Order) => {
  // new snapshot
  if (o.addressSnapshot) {
    const a = o.addressSnapshot;
    const parts = [
      a.city,
      a.area,
      a.street,
      a.building,
    ].filter(Boolean);
    return parts.length ? parts.join("، ") : "غير محدد";
  }
  // old
  const old = [o.address, o.city].filter(Boolean).join("، ");
  return old || "غير محدد";
};