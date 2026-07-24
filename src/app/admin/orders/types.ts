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

/**
 * Immutable copy of the delivery address, frozen onto the order at checkout.
 *
 * This is where the order was actually sent. It is never affected by the
 * customer later editing or deleting the saved address it came from, so support
 * and fulfilment must read this in preference to anything else.
 *
 * Absent on orders placed before the field existed — always fall back to the
 * flat `address` / `city` strings, which are still written on every order.
 */
export interface AddressSnapshot {
  addressId?: string | null;

  name?: string;
  phone?: string;
  whatsapp?: string;

  /** GeoJSON Point, **[longitude, latitude]**. Absent for legacy addresses. */
  location?: {
    type?: "Point";
    coordinates?: [number, number];
  };

  /**
   * The same point in human order. Prefer these over `location.coordinates` —
   * they exist precisely so no consumer has to remember the GeoJSON flip.
   * Null on orders placed from an un-pinned legacy address.
   */
  latitude?: number | null;
  longitude?: number | null;

  formattedAddress?: string;
  placeId?: string;
  /** Open Location Code, when the provider at checkout exposed one. */
  plusCode?: string;
  geoProvider?: string;
  countryCode?: string;
  country?: string;
  administrativeArea?: string;
  city?: string;
  neighborhood?: string;
  postalCode?: string;

  street?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  notes?: string;

  addressLabel?: "home" | "work" | "other";
  locationSource?:
    | "gps"
    | "map_pin"
    | "search"
    | "geocoded"
    | "migrated"
    | "legacy"
    | "manual";
  /** How reliable this address was at checkout. Server-derived. */
  addressConfidence?: "high" | "medium" | "low";
  geocodeAccuracy?: "exact" | "interpolated" | "approximate" | "unknown";
  /** Reported pin accuracy in metres; null when the platform gave none. */
  locationAccuracyMeters?: number | null;

  /** Legacy hierarchy ids, carried so existing reports keep resolving. */
  countryId?: string | null;
  cityId?: string | null;
  subCityId?: string | null;

  /** Kept for records written before the map migration. */
  area?: string;

  snapshotAt?: string;
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

  // merchants
  merchants?: {
    _id: string;
    businessName?: string;
    storeName?: string;
    name?: string;
  }[];

  // new
  items?: OrderItem[];
  subtotal?: number;
  shippingFee?: number;
  total?: number;
  currency?: string;

  // multi-currency snapshot (backend orders.model.js):
  // - currencyCodeSelected: the currency the shopper checked out in
  // - *Converted: amounts already converted into that currency at the
  //   locked-in fx snapshot, ready to display
  currencyCodeSelected?: string;
  totalAmountConverted?: number;
  discountAmountConverted?: number;
  finalAmountConverted?: number;

  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transferProof?: string;

  status: OrderStatus;
  orderNumber?: string;
  createdAt?: string;
  updatedAt?: string;

  addressSnapshot?: AddressSnapshot;

  // old fallback fields (USD base)
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

const CURRENCY_SYMBOLS: Record<string, string> = {
  SDG: "ج.س",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SAR: "ر.س",
  EGP: "ج.م",
};

export const formatMoney = (amount?: number, currency = "USD") => {
  const v = typeof amount === "number" && isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en", { minimumFractionDigits: 2 }).format(v);
  const symbol = CURRENCY_SYMBOLS[String(currency || "").toUpperCase()] || currency || "";
  return `${formatted} ${symbol}`.trim();
};

// ─────────────────────────────────────────────────────────────
// Money / currency accessors — always prefer the backend's converted
// snapshot so the dashboard shows what the shopper actually paid.
// ─────────────────────────────────────────────────────────────

export const getOrderCurrency = (o: Order) =>
  o.currencyCodeSelected || o.currency || "USD";

export const getOrderTotal = (o: Order) => {
  if (typeof o.finalAmountConverted === "number") return o.finalAmountConverted;
  if (typeof o.total === "number") return o.total;
  if (typeof o.finalAmount === "number") return o.finalAmount;
  if (typeof o.totalAmount === "number") return o.totalAmount;
  return 0;
};

export const getOrderSubtotal = (o: Order) => {
  if (typeof o.totalAmountConverted === "number") return o.totalAmountConverted;
  if (typeof o.subtotal === "number") return o.subtotal;
  if (typeof o.totalAmount === "number") return o.totalAmount;
  return 0;
};

export const getOrderDiscount = (o: Order) => {
  if (typeof o.discountAmountConverted === "number") return o.discountAmountConverted;
  if (typeof o.discountAmount === "number") return o.discountAmount;
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

export const getMerchantNames = (o: Order) => {
  if (!o.merchants || o.merchants.length === 0) return "غير محدد";
  return o.merchants
    .map((m) => m.businessName || m.storeName || m.name || "")
    .filter(Boolean)
    .join(", ") || "غير محدد";
};

export const getAddressText = (o: Order) => {
  const a = o.addressSnapshot;

  if (a) {
    // Map-first orders carry the geocoded line the shopper confirmed on the
    // map. It is the whole address, so anything reassembled from parts would
    // only be a worse version of it.
    if (a.formattedAddress) return a.formattedAddress;

    const parts = [
      a.street,
      a.neighborhood || a.area,
      a.city,
      a.building,
    ].filter(Boolean);

    if (parts.length) return parts.join("، ");
  }

  // Orders placed before the snapshot existed, and any snapshot with no
  // geography at all: the flat strings are still written on every order.
  const old = [o.address, o.city].filter(Boolean).join("، ");
  return old || "غير محدد";
};