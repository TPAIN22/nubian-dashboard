"use client";

import * as React from "react";
import {
  Ban,
  Copy,
  ExternalLink,
  Loader2,
  Printer,
  RotateCcw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import MapThumbnail from "@/components/geo/MapThumbnail";
import { fetchGeoConfig } from "@/lib/geo";
import logger from "@/lib/logger";
import { cn } from "@/lib/utils";

import { OrderStatusBadge, PaymentStatusBadge } from "./orderBadges";
import { OrderItemThumbnail } from "./orderItemsCell";
import { printOrderInvoice } from "./orderInvoice";
import { getPaymentMethodLabel, isTerminalStatus } from "./orderStatus";
import { ProductDetailsDialog } from "./productDetailsDialog";
import {
  approveBankakPayment,
  rejectBankakPayment,
  updateOrderStatus,
  updatePaymentStatus,
  type AdminOrderStatus,
  type AdminPaymentStatus,
} from "./orderControler";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getOrderCouponCode,
  getOrderCurrency,
  getOrderDiscount,
  getOrderLines,
  getOrderShipping,
  getOrderSubtotal,
  getOrderTimeline,
  getOrderTotal,
  getPaymentStatusInArabic,
  getStatusInArabic,
  type Order,
  type OrderLine,
  type TimelineState,
} from "./types";

/**
 * Order details, as a right-side drawer.
 *
 * This replaces the old centred modal. A drawer keeps the table visible behind
 * it, so support can work an order and glance back at the queue without losing
 * their place — the reason it is preferred over routing to a detail page for a
 * screen that is used dozens of times an hour.
 *
 * Everything the table deliberately hides lives here: the complete item list
 * with thumbnails and per-line pricing, the money breakdown, the delivery
 * destination, the derived timeline, and the mutations.
 */

const statusOptions: { value: AdminOrderStatus; label: string }[] = [
  { value: "PENDING", label: "بانتظار التأكيد" },
  { value: "AWAITING_PAYMENT_CONFIRMATION", label: "بانتظار موافقة التحويل" },
  { value: "CONFIRMED", label: "تم التأكيد" },
  { value: "PROCESSING", label: "قيد التجهيز" },
  { value: "SHIPPED", label: "تم الشحن" },
  { value: "DELIVERED", label: "تم التسليم" },
  { value: "CANCELLED", label: "ملغي" },
  { value: "PAYMENT_FAILED", label: "فشل الدفع" },
];

// Labels mirror PAYMENT_STATUS_META so the dropdown and the badge read the
// same for a given value.
const paymentOptions: { value: AdminPaymentStatus; label: string }[] = [
  { value: "pending", label: "بانتظار الدفع" },
  { value: "paid", label: "مدفوع" },
  { value: "failed", label: "فشل" },
];

interface Props {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after any mutation so the parent can refetch the list. */
  onChanged?: () => void;
}

const safeText = (v: any, fallback = "—") => {
  const s = String(v ?? "").trim();
  return s || fallback;
};

export function OrderDetailsDrawer({ order, open, onOpenChange, onChanged }: Props) {
  const [status, setStatus] = React.useState("");
  const [paymentStatus, setPaymentStatus] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");
  /** Name of the in-flight action, or null. One flag keeps every button's spinner honest. */
  const [pending, setPending] = React.useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [activeLine, setActiveLine] = React.useState<OrderLine | null>(null);

  React.useEffect(() => {
    if (!order) return;
    setStatus(String(order.status || ""));
    setPaymentStatus(String(order.paymentStatus || ""));
    setRejectReason("");
    setPending(null);
  }, [order]);

  // Provider-neutral map config for the destination preview. Cached for the
  // session — it only changes when the backend is redeployed.
  const { data: geoConfig } = useQuery({
    queryKey: ["geo-config"],
    queryFn: fetchGeoConfig,
    staleTime: 60 * 60 * 1000,
  });

  const currency = order ? getOrderCurrency(order) : "USD";
  const lines = React.useMemo(() => getOrderLines(order), [order]);
  const timeline = React.useMemo(() => (order ? getOrderTimeline(order) : []), [order]);

  const totals = React.useMemo(() => {
    if (!order) return { subtotal: 0, shipping: 0, discount: 0, total: 0 };
    return {
      subtotal: getOrderSubtotal(order),
      shipping: getOrderShipping(order),
      discount: getOrderDiscount(order) || order.couponDetails?.discountAmount || 0,
      total: getOrderTotal(order),
    };
  }, [order]);

  const address = React.useMemo(() => {
    if (!order) return null;
    const snap = order.addressSnapshot;

    // The snapshot's `formattedAddress` is the geocoded line the shopper
    // confirmed on the map; anything reassembled from parts is strictly worse.
    const composed =
      snap?.formattedAddress ||
      [snap?.street, snap?.neighborhood || snap?.area, snap?.city, snap?.country]
        .filter(Boolean)
        .join("، ");

    const fallback = [order.address, order.city].filter(Boolean).join("، ");

    // Prefer the denormalised lat/lng the snapshot carries for exactly this
    // reason; fall back to flipping the GeoJSON pair for older snapshots.
    const coordinates: [number, number] | null =
      typeof snap?.latitude === "number" && typeof snap?.longitude === "number"
        ? [snap.latitude, snap.longitude]
        : Array.isArray(snap?.location?.coordinates) && snap.location.coordinates.length === 2
          ? [snap.location.coordinates[1], snap.location.coordinates[0]]
          : null;

    return {
      fullName: safeText(snap?.name || order.customerInfo?.name, "غير محدد"),
      phone: safeText(snap?.phone || order.customerInfo?.phone || order.phoneNumber, "غير محدد"),
      whatsapp: safeText(snap?.whatsapp, "غير محدد"),
      fullAddress: safeText(composed || fallback),
      deliveryDetails: [
        snap?.building && `مبنى ${snap.building}`,
        snap?.floor && `طابق ${snap.floor}`,
        snap?.apartment && `شقة ${snap.apartment}`,
        snap?.landmark && `بالقرب من ${snap.landmark}`,
      ]
        .filter(Boolean)
        .join(" · "),
      coordinates,
      notes: snap?.notes || "",
    };
  }, [order]);

  const isBankak = order?.paymentMethod === "BANKAK";
  // A BANKAK order with a proof attached and payment not yet settled is exactly
  // the approve/reject case. This used to test for "PENDING_CONFIRMATION", which
  // the backend never persists, so the buttons never appeared.
  const canApproveReject =
    !!order &&
    isBankak &&
    !!order.transferProof &&
    ["pending", "PENDING", "PENDING_CONFIRMATION"].includes(String(order.paymentStatus));

  const terminal = isTerminalStatus(order?.status);
  const canMarkShipped =
    !!order && !terminal && !["SHIPPED", "shipped", "DELIVERED", "delivered"].includes(String(order.status));
  const canCancel = !!order && !terminal;
  // Refundable only once money has actually moved and the order is off the
  // fulfilment path. See the button for why it can't be actioned yet.
  const refundApplicable =
    !!order && ["PAID", "paid"].includes(String(order.paymentStatus)) && terminal;

  const orderRef = order?.orderNumber || order?._id || "";

  // ── mutations ──────────────────────────────────────────────
  // Auth is attached server-side by the proxy route, so no token is threaded
  // through here; `orderControler` generates a fresh idempotency key per call.

  const run = async (name: string, fn: () => Promise<unknown>, success: string) => {
    if (!order) return;
    setPending(name);
    try {
      await fn();
      toast.success(success);
      onChanged?.();
      return true;
    } catch (error: any) {
      logger.error("Order action failed", { action: name, orderId: order._id, error: error?.message });
      toast.error(error?.message || "تعذّر تنفيذ العملية");
      return false;
    } finally {
      setPending(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!order) return;
    const statusChanged = status && status !== String(order.status || "");
    const paymentChanged = paymentStatus && paymentStatus !== String(order.paymentStatus || "");

    if (!statusChanged && !paymentChanged) {
      toast.error("لم يتم إجراء أي تغييرات.");
      return;
    }

    const ok = await run(
      "save",
      async () => {
        if (statusChanged) await updateOrderStatus(order._id, status as AdminOrderStatus);
        if (paymentChanged) await updatePaymentStatus(order._id, paymentStatus as AdminPaymentStatus);
      },
      "تم تحديث الطلب بنجاح.",
    );
    if (ok) onOpenChange(false);
  };

  const handleMarkShipped = () =>
    run("ship", () => updateOrderStatus(order!._id, "SHIPPED"), "تم تعليم الطلب كمشحون.");

  const handleCancel = async () => {
    const ok = await run("cancel", () => updateOrderStatus(order!._id, "CANCELLED"), "تم إلغاء الطلب.");
    setConfirmCancel(false);
    if (ok) onOpenChange(false);
  };

  const handleApprove = async () => {
    const ok = await run("approve", () => approveBankakPayment(order!._id), "تم قبول التحويل وتأكيد الدفع.");
    if (ok) onOpenChange(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("اكتب سبب الرفض");
      return;
    }
    const ok = await run(
      "reject",
      () => rejectBankakPayment(order!._id, rejectReason.trim()),
      "تم رفض التحويل.",
    );
    if (ok) onOpenChange(false);
  };

  const handleCopyId = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order._id);
      toast.success("تم نسخ معرف الطلب");
    } catch {
      toast.error("تعذّر النسخ إلى الحافظة");
    }
  };

  const handlePrint = async () => {
    if (!order) return;
    setPending("print");
    try {
      await printOrderInvoice({ order, lines, totals, currency });
    } catch (error: any) {
      logger.error("Invoice print failed", { orderId: order._id, error: error?.message });
      toast.error("تعذّر فتح نافذة الطباعة. حاول مرة أخرى.");
    } finally {
      setPending(null);
    }
  };

  const busy = pending !== null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          // The primitive pins its close button to the physical right, which in
          // this RTL dashboard is the *start* of the header — straight on top of
          // the order number. Move it to the trailing edge instead.
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl [&>button:last-of-type]:end-4 [&>button:last-of-type]:right-auto"
        >
          {order ? (
            <>
              <SheetHeader className="space-y-0 border-b border-border/60 bg-muted/30 px-5 py-4 text-start">
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <span className="text-xs text-muted-foreground">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </span>
                </div>

                <SheetTitle className="mt-2 font-mono text-lg leading-tight">
                  {order.orderNumber || order._id}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {formatDateTime(order.createdAt || order.orderDate)} ·{" "}
                  {lines.length} منتج · {formatMoney(totals.total, currency)}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                {/* ── Quick actions ── */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handlePrint} disabled={busy}>
                    {pending === "print" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Printer className="size-4" />
                    )}
                    طباعة
                  </Button>

                  <Button size="sm" variant="outline" onClick={handleCopyId} disabled={busy}>
                    <Copy className="size-4" />
                    نسخ المعرف
                  </Button>

                  {canMarkShipped ? (
                    <Button size="sm" variant="outline" onClick={handleMarkShipped} disabled={busy}>
                      {pending === "ship" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Truck className="size-4" />
                      )}
                      تعليم كمشحون
                    </Button>
                  ) : null}

                  {canCancel ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmCancel(true)}
                      disabled={busy}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Ban className="size-4" />
                      إلغاء الطلب
                    </Button>
                  ) : null}

                  {refundApplicable ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* Wrapper span: a disabled button emits no pointer
                            events, so the tooltip would never open on it. */}
                        <span tabIndex={0}>
                          <Button size="sm" variant="outline" disabled>
                            <RotateCcw className="size-4" />
                            استرداد
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[240px]">
                        {/* TODO(backend): no refund endpoint exists on
                            /api/orders yet. Surfaced as a disabled affordance so
                            ops can see the order qualifies and escalate, rather
                            than hunting for an action that isn't there. */}
                        الاسترداد يتم حالياً خارج اللوحة — لم يتم توفير واجهة استرداد في الواجهة الخلفية بعد.
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>

                {/* ── Customer ── */}
                <Section title="العميل">
                  <Field label="الاسم" value={safeText(order.customerInfo?.name, "غير محدد")} />
                  <Field label="البريد" value={safeText(order.customerInfo?.email, "غير محدد")} />
                  <Field
                    label="الهاتف"
                    value={<span dir="ltr">{safeText(order.customerInfo?.phone || order.phoneNumber, "غير محدد")}</span>}
                  />
                  {address?.whatsapp && address.whatsapp !== "غير محدد" ? (
                    <Field label="واتساب" value={<span dir="ltr">{address.whatsapp}</span>} />
                  ) : null}
                  <Field label="تاريخ الطلب" value={formatDate(order.createdAt || order.orderDate)} />
                </Section>

                {/* ── Shipping address ── */}
                {address ? (
                  <Section title="وجهة التوصيل">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Field label="المستلم" value={address.fullName} />
                        <Field label="العنوان" value={address.fullAddress} />
                        {address.deliveryDetails ? (
                          <Field label="تفاصيل الوصول" value={address.deliveryDetails} />
                        ) : null}
                        {address.coordinates ? (
                          <Field
                            label="الإحداثيات"
                            value={
                              <span dir="ltr" className="font-mono text-xs">
                                {address.coordinates[0].toFixed(6)}, {address.coordinates[1].toFixed(6)}
                              </span>
                            }
                          />
                        ) : (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            لا توجد إحداثيات لهذا الطلب (عنوان قديم)
                          </p>
                        )}
                      </div>

                      {address.coordinates && geoConfig ? (
                        <MapThumbnail
                          latitude={address.coordinates[0]}
                          longitude={address.coordinates[1]}
                          config={geoConfig}
                          width={240}
                          height={140}
                          className="shrink-0"
                        />
                      ) : null}
                    </div>
                  </Section>
                ) : null}

                {/* ── Items ── */}
                <section className="space-y-2">
                  <SectionTitle>المنتجات ({lines.length})</SectionTitle>
                  <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card/40">
                    {lines.length === 0 ? (
                      <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                        لا توجد منتجات مرتبطة بهذا الطلب.
                      </li>
                    ) : (
                      lines.map((line) => (
                        <li key={line.key}>
                          <button
                            type="button"
                            onClick={() => setActiveLine(line)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                          >
                            <OrderItemThumbnail
                              src={line.image}
                              alt={line.name}
                              className="size-10"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{line.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {line.variantLabel
                                  ? `${line.variantLabel} · `
                                  : ""}
                                {formatMoney(line.unitPrice, currency)} × {line.quantity}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums">
                              {formatMoney(line.lineTotal, currency)}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </section>

                {/* ── Money ── */}
                <Section title="ملخص المبالغ">
                  <Field label="المجموع الفرعي" value={formatMoney(totals.subtotal, currency)} numeric />
                  <Field label="الشحن" value={formatMoney(totals.shipping, currency)} numeric />
                  {totals.discount > 0 ? (
                    <Field
                      label={
                        getOrderCouponCode(order)
                          ? `الخصم (${getOrderCouponCode(order)})`
                          : "الخصم"
                      }
                      value={
                        <span className="text-red-600 dark:text-red-400">
                          −{formatMoney(totals.discount, currency)}
                        </span>
                      }
                      numeric
                    />
                  ) : null}
                  <div className="mt-1 flex items-center justify-between gap-3 border-t border-border/60 pt-2">
                    <span className="text-sm font-semibold">الإجمالي</span>
                    <span className="text-base font-bold tabular-nums text-primary">
                      {formatMoney(totals.total, currency)}
                    </span>
                  </div>
                </Section>

                {/* ── Payment ── */}
                <Section title="الدفع">
                  <Field label="الطريقة" value={getPaymentMethodLabel(order.paymentMethod)} />
                  <Field label="الحالة" value={getPaymentStatusInArabic(String(order.paymentStatus || ""))} />
                  <Field label="حالة الطلب" value={getStatusInArabic(String(order.status || ""))} />

                  {order.transferProof ? (
                    <div className="space-y-2 pt-1">
                      <img
                        src={order.transferProof}
                        alt="إيصال التحويل"
                        loading="lazy"
                        decoding="async"
                        className="max-h-72 w-full rounded-lg border border-border/60 bg-black/5 object-contain"
                      />
                      <a
                        href={order.transferProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        فتح الصورة في نافذة جديدة
                      </a>
                    </div>
                  ) : null}
                </Section>

                {canApproveReject ? (
                  <section className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <SectionTitle>مراجعة تحويل بنكك</SectionTitle>
                    <div className="space-y-2">
                      <Label htmlFor="rejectReason" className="text-xs">
                        سبب الرفض (مطلوب عند الرفض فقط)
                      </Label>
                      <Input
                        id="rejectReason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="مثال: الإيصال غير واضح / المبلغ غير مطابق"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleApprove}
                        disabled={busy}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {pending === "approve" ? <Loader2 className="size-4 animate-spin" /> : null}
                        قبول التحويل
                      </Button>
                      <Button size="sm" variant="destructive" onClick={handleReject} disabled={busy}>
                        {pending === "reject" ? <Loader2 className="size-4 animate-spin" /> : null}
                        رفض التحويل
                      </Button>
                    </div>
                  </section>
                ) : null}

                {/* ── Timeline ── */}
                <section className="space-y-2">
                  <SectionTitle>المسار الزمني</SectionTitle>
                  <ol className="rounded-lg border border-border/60 bg-card/40 p-3">
                    {timeline.map((step, index) => (
                      <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < timeline.length - 1 ? (
                          <span
                            className="absolute bottom-0 top-4 start-[5px] w-px bg-border"
                            aria-hidden="true"
                          />
                        ) : null}
                        <span
                          className={cn(
                            "mt-1 size-2.5 shrink-0 rounded-full ring-2 ring-background",
                            TIMELINE_DOT[step.state],
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm leading-tight",
                              step.state === "upcoming" && "text-muted-foreground",
                              step.state === "current" && "font-medium",
                            )}
                          >
                            {step.label}
                          </p>
                          {step.at ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDateTime(step.at)}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* ── Notes ── */}
                <Section title="ملاحظات">
                  {address?.notes ? (
                    <Field label="ملاحظات التوصيل" value={address.notes} />
                  ) : null}
                  {order.bankakApproval?.reason ? (
                    <Field label="سبب رفض التحويل" value={order.bankakApproval.reason} />
                  ) : null}
                  {!address?.notes && !order.bankakApproval?.reason ? (
                    <p className="text-sm text-muted-foreground">لا توجد ملاحظات على هذا الطلب.</p>
                  ) : null}
                </Section>

                {/* ── Manual status edit ── */}
                <section className="space-y-3">
                  <SectionTitle>تحديث الحالة</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="orderStatus" className="text-xs">
                        حالة الطلب
                      </Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="orderStatus" className="w-full">
                          <SelectValue placeholder="اختر حالة الطلب" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          {statusOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="paymentStatusSelect" className="text-xs">
                        حالة الدفع
                      </Label>
                      <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                        <SelectTrigger id="paymentStatusSelect" className="w-full">
                          <SelectValue placeholder="اختر حالة الدفع" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          {paymentOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>
              </div>

              <SheetFooter className="mt-0 flex-row items-center justify-end gap-2 border-t border-border/60 bg-muted/20 px-5 py-3">
                <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
                  إغلاق
                </Button>
                <Button onClick={handleSaveChanges} disabled={busy}>
                  {pending === "save" ? <Loader2 className="size-4 animate-spin" /> : null}
                  حفظ التغييرات
                </Button>
              </SheetFooter>
            </>
          ) : (
            // Radix requires a title for a11y even while the drawer is empty.
            <SheetHeader className="px-5 py-4">
              <SheetTitle>تفاصيل الطلب</SheetTitle>
              <SheetDescription>جاري تحميل تفاصيل الطلب...</SheetDescription>
            </SheetHeader>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="إلغاء الطلب؟"
        description={`سيتم تحويل الطلب ${orderRef} إلى حالة "ملغي". لا يمكن التراجع عن هذا الإجراء من اللوحة.`}
        confirmText="نعم، ألغِ الطلب"
        variant="destructive"
        loading={pending === "cancel"}
        onConfirm={handleCancel}
      />

      <ProductDetailsDialog
        line={activeLine}
        currency={currency}
        open={!!activeLine}
        onOpenChange={(next) => !next && setActiveLine(null)}
      />
    </>
  );
}

const TIMELINE_DOT: Record<TimelineState, string> = {
  done: "bg-emerald-500",
  current: "bg-sky-500",
  failed: "bg-red-500",
  upcoming: "bg-muted-foreground/30",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-muted-foreground">{children}</h3>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <SectionTitle>{title}</SectionTitle>
      <dl className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3 text-sm">
        {children}
      </dl>
    </section>
  );
}

function Field({
  label,
  value,
  numeric,
}: {
  label: string;
  value: React.ReactNode;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 text-end font-medium break-words", numeric && "tabular-nums")}>
        {value}
      </dd>
    </div>
  );
}

export default OrderDetailsDrawer;
