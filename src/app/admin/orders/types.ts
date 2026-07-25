// ─────────────────────────────────────────────────────────────
// Shared Types and Interfaces
// ─────────────────────────────────────────────────────────────

import {
  getOrderStatusMeta,
  getPaymentMethodLabel,
  getPaymentStatusMeta,
} from "./orderStatus";

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

  /** Bankak review trail — the only per-transition timestamps the order stores. */
  bankakApproval?: {
    status?: "pending" | "approved" | "rejected";
    approvedAt?: string;
    rejectedAt?: string;
    reason?: string;
  };

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

// Label lookups now delegate to `orderStatus.ts`, which owns the label *and*
// the colour for each status. Kept as functions so existing call sites and the
// PDF template don't have to change.
export const getStatusInArabic = (status: string) => getOrderStatusMeta(status).label;

export const getPaymentStatusInArabic = (s: string) => getPaymentStatusMeta(s).label;

export const getPaymentMethodArabic = (m?: string) => getPaymentMethodLabel(m);

export const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-SD", { year: "numeric", month: "short", day: "numeric" });
};

/** Date + time. Support needs the clock time when reconciling a transfer. */
export const formatDateTime = (dateString?: string) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-SD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

// ─────────────────────────────────────────────────────────────
// Line items
//
// An order can arrive carrying its products under any of three keys, and the
// admin list endpoint returns two of them at once (`products`, the raw
// populated array, alongside `productsDetails`, the currency-converted display
// copy). Every consumer used to re-derive this on its own, which is how the
// table ended up reading `items[].name` while the dialog read
// `products[].product.name` and neither ever showed a thumbnail.
//
// `getOrderLines` is now the only place that knows about those shapes.
// ─────────────────────────────────────────────────────────────

export interface OrderLine {
  /** Stable key for React lists; index-suffixed because the same product can appear twice with different variants. */
  key: string;
  productId?: string;
  name: string;
  quantity: number;
  /** Unit price in the order's display currency. */
  unitPrice: number;
  lineTotal: number;
  image?: string;
  /** Pre-joined variant summary, e.g. "مقاس: L · لون: أسود". Empty when the product has no variant. */
  variantLabel: string;
  /** Original payload, so the product detail dialog can show fields this shape doesn't model. */
  raw: any;
}

const FALLBACK_PRODUCT_NAME = "منتج غير معروف";

/** Flattens `attributes` / `size` / `color` into one readable variant line. */
const buildVariantLabel = (source: any): string => {
  const attrs = source?.attributes;
  const parts: string[] = [];

  if (attrs && typeof attrs === "object" && Object.keys(attrs).length > 0) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === "") continue;
      parts.push(`${key}: ${String(value)}`);
    }
  } else if (source?.size) {
    parts.push(`مقاس: ${source.size}`);
  }

  if (source?.color) parts.push(`لون: ${source.color}`);

  return parts.join(" · ");
};

const toNumber = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const getOrderLines = (o?: Order | null): OrderLine[] => {
  if (!o) return [];

  const build = (
    source: any[],
    pick: (item: any) => { name?: string; image?: string; unitPrice: number; lineTotal?: number },
  ): OrderLine[] =>
    source.map((item, idx) => {
      const { name, image, unitPrice, lineTotal } = pick(item);
      const quantity = Math.max(0, toNumber(item?.quantity, 1));

      return {
        key: `${item?.productId ?? item?.product?._id ?? name ?? "line"}-${item?.variantId ?? ""}-${idx}`,
        productId: item?.productId ?? item?.product?._id,
        name: String(name || "").trim() || FALLBACK_PRODUCT_NAME,
        quantity,
        unitPrice,
        lineTotal: lineTotal ?? unitPrice * quantity,
        image,
        variantLabel: buildVariantLabel(item),
        raw: item,
      };
    });

  // New checkout shape.
  if (Array.isArray(o.items) && o.items.length) {
    return build(o.items, (it) => ({
      name: it?.name,
      image: it?.image,
      unitPrice: toNumber(it?.price),
    }));
  }

  // What `/orders/admin` actually returns today: prices already converted into
  // the shopper's currency, and the populated product's image list.
  if (Array.isArray(o.productsDetails) && o.productsDetails.length) {
    return build(o.productsDetails as any[], (p: any) => ({
      name: p?.name,
      image: Array.isArray(p?.images) ? p.images[0] : undefined,
      unitPrice: toNumber(p?.finalPrice ?? p?.price),
      lineTotal: typeof p?.totalPrice === "number" ? p.totalPrice : undefined,
    }));
  }

  // Raw populated array from `order.toObject()` — base-currency prices, so only
  // used when the formatted copy is missing entirely.
  if (Array.isArray(o.products) && o.products.length) {
    return build(o.products, (p: any) => ({
      name: p?.product?.name ?? p?.name,
      image: Array.isArray(p?.product?.images) ? p.product.images[0] : undefined,
      unitPrice: toNumber(p?.price ?? p?.product?.price),
    }));
  }

  return [];
};

/**
 * Shipping charged on the order.
 *
 * The order model has no shipping field yet, so for every order placed so far
 * this resolves to whatever is left over once the discount is applied to the
 * subtotal — i.e. zero. Deriving it rather than hard-coding `0` means the
 * totals block always reconciles: subtotal − discount + shipping === total,
 * even for an order whose amounts were adjusted upstream.
 */
export const getOrderShipping = (o: Order) => {
  if (typeof o.shippingFee === "number") return o.shippingFee;
  const residual = getOrderTotal(o) - (getOrderSubtotal(o) - getOrderDiscount(o));
  return residual > 0.009 ? residual : 0;
};

export const getOrderCouponCode = (o: Order) => o.couponDetails?.code || "";

// ─────────────────────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────────────────────

export type TimelineState = "done" | "current" | "upcoming" | "failed";

export interface TimelineStep {
  key: string;
  label: string;
  /** ISO string, present only where the backend actually records a timestamp. */
  at?: string;
  state: TimelineState;
}

/**
 * Derives a fulfilment timeline from the fields the order actually carries.
 *
 * The backend stores no per-transition history — only `createdAt`, `updatedAt`
 * and the Bankak approval/rejection stamps. So each step's *state* comes from
 * the status funnel, and a timestamp is attached only where one genuinely
 * exists: the moment the order was placed, the moment a transfer was approved
 * or rejected, and `updatedAt` against whichever step the order is sitting on
 * now. Intermediate steps are deliberately left without a time rather than
 * given a made-up one.
 */
export const getOrderTimeline = (o: Order): TimelineStep[] => {
  const status = String(o.status || "");
  const rank = getOrderStatusMeta(status).rank;
  const isCancelled = rank === -1;
  const updatedAt = o.updatedAt;

  const payment = getPaymentStatusMeta(String(o.paymentStatus || ""));
  const approval = o.bankakApproval;

  const steps: TimelineStep[] = [
    {
      key: "placed",
      label: "تم استلام الطلب",
      at: o.createdAt || o.orderDate,
      state: "done",
    },
  ];

  if (payment.rank === 2) {
    steps.push({
      key: "paid",
      label: "تم تأكيد الدفع",
      at: approval?.approvedAt,
      state: "done",
    });
  } else if (payment.rank === -1) {
    steps.push({
      key: "payment-failed",
      label: approval?.rejectedAt ? "تم رفض التحويل" : "فشل الدفع",
      at: approval?.rejectedAt,
      state: "failed",
    });
  } else {
    steps.push({
      key: "payment-pending",
      label: "بانتظار تأكيد الدفع",
      state: isCancelled ? "upcoming" : "current",
    });
  }

  const funnel: { key: string; label: string; rank: number }[] = [
    { key: "confirmed", label: "تم التأكيد والتجهيز", rank: 2 },
    { key: "shipped", label: "تم الشحن", rank: 3 },
    { key: "delivered", label: "تم التسليم", rank: 4 },
  ];

  for (const step of funnel) {
    const state: TimelineState = isCancelled
      ? "upcoming"
      : rank > step.rank
        ? "done"
        : rank === step.rank
          ? "current"
          : "upcoming";

    // `updatedAt` is the only timestamp that maps to a transition, and it maps
    // to the most recent one — so it belongs on the step the order is on now.
    steps.push({
      key: step.key,
      label: step.label,
      at: state === "current" ? updatedAt : undefined,
      state,
    });
  }

  if (isCancelled) {
    steps.push({
      key: "cancelled",
      label: status === "PAYMENT_FAILED" ? "فشل الدفع وأُلغي الطلب" : "تم إلغاء الطلب",
      at: updatedAt,
      state: "failed",
    });
  }

  return steps;
};