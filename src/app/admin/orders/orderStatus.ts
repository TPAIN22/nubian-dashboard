// ─────────────────────────────────────────────────────────────
// Single source of truth for how an order's status is *shown*.
//
// Before this file the Arabic labels lived in `types.ts` and the colours lived
// as a chain of ternaries inside the table cell, so a status could be labelled
// in one place and coloured in another — "SHIPPED" was blue in the table and
// had no colour at all in the dialog. Label, tone and funnel position now
// travel together, and every surface (table, drawer, mobile card, timeline)
// reads the same record.
//
// Both the SCREAMING_CASE statuses the dashboard sends and the lowercase ones
// the Mongo enum actually stores are keyed here on purpose: the backend
// normalises PROCESSING→confirmed, AWAITING_PAYMENT_CONFIRMATION→pending and
// PAYMENT_FAILED→cancelled on write, so a list response mixes both vocabularies.
// ─────────────────────────────────────────────────────────────

import type { Tone } from "@/components/dashboard/ToneBadge";

export interface StatusMeta {
  label: string;
  tone: Tone;
  /**
   * Position in the fulfilment funnel, used to decide which timeline steps are
   * already behind us. `-1` means the order left the funnel (cancelled/failed).
   */
  rank: number;
}

const UNKNOWN: StatusMeta = { label: "—", tone: "muted", rank: 0 };

export const ORDER_STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: "بانتظار التأكيد", tone: "warning", rank: 1 },
  AWAITING_PAYMENT_CONFIRMATION: { label: "بانتظار موافقة التحويل", tone: "warning", rank: 1 },
  CONFIRMED: { label: "مؤكد", tone: "info", rank: 2 },
  PROCESSING: { label: "قيد التجهيز", tone: "info", rank: 2 },
  SHIPPED: { label: "تم الشحن", tone: "info", rank: 3 },
  DELIVERED: { label: "تم التسليم", tone: "success", rank: 4 },
  CANCELLED: { label: "ملغي", tone: "danger", rank: -1 },
  PAYMENT_FAILED: { label: "فشل الدفع", tone: "danger", rank: -1 },

  // Lowercase enum values as persisted by the backend.
  pending: { label: "بانتظار التأكيد", tone: "warning", rank: 1 },
  confirmed: { label: "مؤكد", tone: "info", rank: 2 },
  shipped: { label: "تم الشحن", tone: "info", rank: 3 },
  delivered: { label: "تم التسليم", tone: "success", rank: 4 },
  cancelled: { label: "ملغي", tone: "danger", rank: -1 },
};

export const PAYMENT_STATUS_META: Record<string, StatusMeta> = {
  UNPAID: { label: "غير مدفوع", tone: "muted", rank: 0 },
  PENDING_CONFIRMATION: { label: "بانتظار موافقة التحويل", tone: "warning", rank: 1 },
  PAID: { label: "مدفوع", tone: "success", rank: 2 },
  REJECTED: { label: "مرفوض", tone: "danger", rank: -1 },
  FAILED: { label: "فشل", tone: "danger", rank: -1 },

  pending: { label: "بانتظار الدفع", tone: "warning", rank: 1 },
  paid: { label: "مدفوع", tone: "success", rank: 2 },
  failed: { label: "فشل", tone: "danger", rank: -1 },
};

export const getOrderStatusMeta = (status?: string): StatusMeta =>
  (status && ORDER_STATUS_META[status]) || { ...UNKNOWN, label: status || "—" };

export const getPaymentStatusMeta = (status?: string): StatusMeta =>
  (status && PAYMENT_STATUS_META[status]) || { ...UNKNOWN, label: status || "—" };

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "كاش",
  BANKAK: "بنكك",
  CARD: "بطاقة",
  cash: "كاش",
  card: "بطاقة",
};

export const getPaymentMethodLabel = (method?: string) =>
  (method && PAYMENT_METHOD_LABELS[method]) || method || "—";

/** Terminal states — nothing further can be fulfilled, so no shipping actions. */
export const isTerminalStatus = (status?: string) => getOrderStatusMeta(status).rank === -1;
