import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import logger from "@/lib/logger";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Order } from "./ordersTable";
import { getStatusInArabic, getPaymentStatusInArabic, formatDate } from "./ordersTable";

import {
  updateOrderStatus,
  updatePaymentStatus,
  approveBankakPayment,
  rejectBankakPayment,
  type AdminOrderStatus,
  type AdminPaymentStatus,
} from "@/app/business/orders/orderControler";

// خيارات الحالات (الهندسة الجديدة)
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

const paymentOptions: { value: AdminPaymentStatus; label: string }[] = [
  { value: "UNPAID", label: "غير مدفوع" },
  { value: "PENDING_CONFIRMATION", label: "بانتظار موافقة التحويل" },
  { value: "PAID", label: "مدفوع" },
  { value: "REJECTED", label: "مرفوض" },
  { value: "FAILED", label: "فشل" },
];

interface OrderDialogProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  selectedRow: Order | null;
}

function money(n: any) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-SD", { minimumFractionDigits: 2 }).format(
    Number.isFinite(num) ? num : 0
  );
}

function safeText(v: any, fallback = "—") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

function OrderDialog({ isModalOpen, setIsModalOpen, selectedRow }: OrderDialogProps) {
  const { getToken } = useAuth();

  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedRow) return;
    setStatus(String(selectedRow.status || ""));
    setPaymentStatus(String(selectedRow.paymentStatus || ""));
    setRejectReason("");
  }, [selectedRow]);

  const isBankak = selectedRow?.paymentMethod === "BANKAK";
  const hasProof = !!selectedRow?.transferProof;
  const isPendingConfirmation = selectedRow?.paymentStatus === "PENDING_CONFIRMATION";

  const canApproveReject = useMemo(() => {
    return !!selectedRow && isBankak && hasProof && isPendingConfirmation;
  }, [selectedRow, isBankak, hasProof, isPendingConfirmation]);

  // ✅ Address block (new+old)
  const addressBlock = useMemo(() => {
    if (!selectedRow) return null;

    const snap: any = (selectedRow as any).addressSnapshot;
    const fullName = snap?.name || selectedRow.customerInfo?.name;
    const city = snap?.city || selectedRow.city;
    const area = snap?.area;
    const street = snap?.street || selectedRow.address;
    const building = snap?.building;

    const phone = snap?.phone || selectedRow.customerInfo?.phone || selectedRow.phoneNumber;
    const whatsapp = snap?.whatsapp;

    const parts = [city, area, street, building].filter(Boolean);
    const fullAddress = parts.length ? parts.join("، ") : safeText(`${selectedRow.address || ""}${selectedRow.city ? `، ${selectedRow.city}` : ""}`, "—");

    return {
      fullName: safeText(fullName, "غير محدد"),
      phone: safeText(phone, "غير محدد"),
      whatsapp: safeText(whatsapp, "غير محدد"),
      fullAddress: safeText(fullAddress, "—"),
    };
  }, [selectedRow]);

  const totals = useMemo(() => {
    if (!selectedRow) return { total: 0, subtotal: 0, shipping: 0, discount: 0, final: 0 };

    const subtotal =
      (selectedRow as any).subtotal ??
      (selectedRow as any).totalAmount ??
      0;

    const shipping =
      (selectedRow as any).shippingFee ??
      0;

    const discount =
      (selectedRow as any).discountAmount ??
      (selectedRow as any).couponDetails?.discountAmount ??
      0;

    const final =
      (selectedRow as any).finalTotal ??
      (selectedRow as any).finalAmount ??
      (selectedRow as any).total ??
      (selectedRow as any).totalAmount ??
      0;

    const total =
      (selectedRow as any).total ??
      (selectedRow as any).totalAmount ??
      final;

    return { total, subtotal, shipping, discount, final };
  }, [selectedRow]);

  const normalizedProducts = useMemo(() => {
    if (!selectedRow) return [];

    // prefer new items
    const items: any[] = Array.isArray((selectedRow as any).items) ? (selectedRow as any).items : [];
    if (items.length) {
      return items.map((it) => ({
        name: safeText(it?.name, "منتج غير معروف"),
        quantity: Number(it?.quantity || 1),
        price: Number(it?.price || 0),
      }));
    }

    // fallback productsDetails
    const pd: any[] = Array.isArray((selectedRow as any).productsDetails) ? (selectedRow as any).productsDetails : [];
    if (pd.length) {
      return pd.map((p) => ({
        name: safeText(p?.name, "منتج غير معروف"),
        quantity: Number(p?.quantity || 1),
        price: Number(p?.price || 0),
      }));
    }

    // fallback old products[]
    const prods: any[] = Array.isArray((selectedRow as any).products) ? (selectedRow as any).products : [];
    return prods.map((p) => ({
      name: safeText(p?.product?.name, "منتج غير معروف"),
      quantity: Number(p?.quantity || 1),
      price: Number(p?.product?.price || 0),
    }));
  }, [selectedRow]);

  const handleSaveChanges = async () => {
    if (!selectedRow) return;

    setLoading(true);
    const token = await getToken();
    if (!token) {
      toast.error("فشل في الحصول على رمز المصادقة");
      setLoading(false);
      return;
    }

    try {
      const oldStatus = String(selectedRow.status || "");
      const oldPayment = String(selectedRow.paymentStatus || "");

      const statusChanged = status && status !== oldStatus;
      const paymentChanged = paymentStatus && paymentStatus !== oldPayment;

      if (!statusChanged && !paymentChanged) {
        toast.error("لم يتم إجراء أي تغييرات.");
        return;
      }

      if (statusChanged) {
        await updateOrderStatus(selectedRow._id, status as AdminOrderStatus, token);
      }
      if (paymentChanged) {
        await updatePaymentStatus(selectedRow._id, paymentStatus as AdminPaymentStatus, token);
      }

      toast.success("تم تحديث الطلب بنجاح.");
      setIsModalOpen(false);
    } catch (err: any) {
      logger.error("Error updating order", { error: err?.message || "Unknown" });
      toast.error(`حدث خطأ أثناء التحديث: ${err?.message || "خطأ غير معروف"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRow) return;
    setLoading(true);

    const token = await getToken();
    if (!token) {
      toast.error("فشل في الحصول على رمز المصادقة");
      setLoading(false);
      return;
    }

    try {
      await approveBankakPayment(selectedRow._id, token);
      toast.success("✅ تم قبول التحويل وتأكيد الدفع.");
      setIsModalOpen(false);
    } catch (err: any) {
      logger.error("Approve payment failed", { error: err?.message || "Unknown" });
      toast.error(`فشل قبول التحويل: ${err?.message || "خطأ غير معروف"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRow) return;
    if (!rejectReason.trim()) {
      toast.error("اكتب سبب الرفض");
      return;
    }

    setLoading(true);
    const token = await getToken();
    if (!token) {
      toast.error("فشل في الحصول على رمز المصادقة");
      setLoading(false);
      return;
    }

    try {
      await rejectBankakPayment(selectedRow._id, rejectReason.trim(), token);
      toast.success("⛔ تم رفض التحويل.");
      setIsModalOpen(false);
    } catch (err: any) {
      logger.error("Reject payment failed", { error: err?.message || "Unknown" });
      toast.error(`فشل رفض التحويل: ${err?.message || "خطأ غير معروف"}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save as PDF (print) — EXCLUDES transfer proof image
  const handleSavePdf = () => {
    if (!selectedRow) return;

    const orderId = selectedRow.orderNumber || selectedRow._id;
    const created = formatDate(selectedRow.createdAt || selectedRow.orderDate);

    const couponCode = (selectedRow as any)?.couponDetails?.code || "";
    const discountAmount = totals.discount || 0;

    const productsHtml = normalizedProducts
      .map((p, i) => {
        const line = Number(p.price || 0) * Number(p.quantity || 0);
        return `
          <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(p.name)}</td>
            <td>${p.quantity}</td>
            <td>${money(p.price)} ج.س</td>
            <td>${money(line)} ج.س</td>
          </tr>
        `;
      })
      .join("");

    const html = `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>Order ${escapeHtml(String(orderId))}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: Arial, sans-serif; color: #111; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom: 12px; }
    .brand { font-size: 18px; font-weight: 800; }
    .muted { color:#555; font-size: 12px; }
    .card { border:1px solid #ddd; border-radius: 10px; padding: 12px; margin: 10px 0; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .k { color:#555; font-size: 12px; margin-bottom: 4px; }
    .v { font-weight: 700; }
    table { width:100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border:1px solid #ddd; padding: 8px; font-size: 12px; }
    th { background:#f5f5f5; text-align:right; }
    .totals { width: 100%; margin-top: 8px; }
    .totals td { border:none; padding: 4px 0; }
    .totals .k { width: 55%; }
    .totals .v { text-align:left; }
    .badge { display:inline-block; padding: 3px 8px; border-radius: 999px; background:#eee; font-size: 11px; font-weight: 700; }
    .ok { background:#e6ffed; }
    .warn { background:#fff4e5; }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <div class="brand">Nubian • Order Summary</div>
      <div class="muted">تم إنشاء هذا الملخص للطباعة/الحفظ كـ PDF</div>
    </div>
    <div class="muted">
      <div><b>رقم الطلب:</b> ${escapeHtml(String(orderId))}</div>
      <div><b>التاريخ:</b> ${escapeHtml(String(created))}</div>
    </div>
  </div>

  <div class="card">
    <div class="grid">
      <div>
        <div class="k">العميل</div>
        <div class="v">${escapeHtml(addressBlock?.fullName || "غير محدد")}</div>
        <div class="muted">${escapeHtml(selectedRow.customerInfo?.email || "—")}</div>
      </div>
      <div>
        <div class="k">التواصل</div>
        <div class="v">هاتف: ${escapeHtml(addressBlock?.phone || "—")}</div>
        <div class="muted">واتساب: ${escapeHtml(addressBlock?.whatsapp || "—")}</div>
      </div>
      <div style="grid-column: 1 / -1">
        <div class="k">العنوان</div>
        <div class="v">${escapeHtml(addressBlock?.fullAddress || "—")}</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="grid">
      <div>
        <div class="k">حالة الطلب</div>
        <div class="v"><span class="badge">${escapeHtml(getStatusInArabic(String(selectedRow.status || "")))}</span></div>
      </div>
      <div>
        <div class="k">الدفع</div>
        <div class="v"><span class="badge">${escapeHtml(String(selectedRow.paymentMethod || "—"))}</span></div>
        <div class="muted">${escapeHtml(getPaymentStatusInArabic(String(selectedRow.paymentStatus || "")))}</div>
      </div>
      ${
        couponCode
          ? `<div style="grid-column: 1 / -1">
              <div class="k">الكوبون</div>
              <div class="v">${escapeHtml(String(couponCode))}</div>
              ${discountAmount ? `<div class="muted">خصم: -${money(discountAmount)} ج.س</div>` : ""}
            </div>`
          : ""
      }
    </div>
  </div>

  <div class="card">
    <div class="k">المنتجات</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>المنتج</th>
          <th>الكمية</th>
          <th>سعر الوحدة</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${productsHtml || `<tr><td colspan="5">لا توجد منتجات</td></tr>`}
      </tbody>
    </table>

    <table class="totals">
      <tr>
        <td class="k">المجموع الفرعي</td>
        <td class="v">${money(totals.subtotal)} ج.س</td>
      </tr>
      <tr>
        <td class="k">الشحن</td>
        <td class="v">${money(totals.shipping)} ج.س</td>
      </tr>
      <tr>
        <td class="k">الخصم</td>
        <td class="v">-${money(totals.discount)} ج.س</td>
      </tr>
      <tr>
        <td class="k"><b>الإجمالي النهائي</b></td>
        <td class="v"><b>${money(totals.final)} ج.س</b></td>
      </tr>
    </table>
  </div>

</body>
</html>
`;

    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=900");
    if (!w) {
      toast.error("المتصفح منع فتح نافذة جديدة. فعّل Popups وحاول مرة أخرى.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();

    // wait a tick then print
    setTimeout(() => {
      w.focus();
      w.print();
      // w.close(); // لو دايرها تقفل تلقائيًا فعل السطر ده
    }, 250);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[760px] lg:max-w-[980px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-right">
          <DialogTitle>تفاصيل الطلب</DialogTitle>
          <DialogDescription>
            عرض وتحديث الطلب رقم: {selectedRow?.orderNumber || selectedRow?._id || "N/A"}
          </DialogDescription>
        </DialogHeader>

        {selectedRow ? (
          <div className="grid gap-4 py-4 text-right">
            {/* معلومات العميل */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <p><span className="font-semibold">اسم العميل:</span> {selectedRow.customerInfo?.name || "غير محدد"}</p>
              <p><span className="font-semibold">البريد:</span> {selectedRow.customerInfo?.email || "غير محدد"}</p>
              <p><span className="font-semibold">الهاتف:</span> {selectedRow.customerInfo?.phone || "غير محدد"}</p>
              <p><span className="font-semibold">تاريخ الطلب:</span> {formatDate(selectedRow.createdAt || selectedRow.orderDate)}</p>
            </div>

            {/* ✅ العنوان */}
            {addressBlock ? (
              <div className="mt-1 rounded-lg border p-4 bg-muted/30">
                <div className="font-semibold mb-2">العنوان</div>
                <div className="text-sm">
                  <div><span className="text-muted-foreground">الاسم:</span> {addressBlock.fullName}</div>
                  <div><span className="text-muted-foreground">الهاتف:</span> {addressBlock.phone}</div>
                  <div><span className="text-muted-foreground">واتساب:</span> {addressBlock.whatsapp}</div>
                  <div className="mt-2"><span className="text-muted-foreground">العنوان الكامل:</span> {addressBlock.fullAddress}</div>
                </div>
              </div>
            ) : null}

            {/* الدفع */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-2">
              <div>
                <div className="text-sm text-muted-foreground">طريقة الدفع</div>
                <div className="font-semibold">{selectedRow.paymentMethod || "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">حالة الدفع الحالية</div>
                <div className="font-semibold">{getPaymentStatusInArabic(String(selectedRow.paymentStatus || ""))}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">حالة الطلب الحالية</div>
                <div className="font-semibold">{getStatusInArabic(String(selectedRow.status || ""))}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">الإجمالي</div>
                <div className="font-bold text-primary">
                  {money((selectedRow.total ?? selectedRow.finalAmount ?? (selectedRow as any).finalTotal ?? selectedRow.totalAmount ?? 0) as number)}{" "}
                  ج.س
                </div>
              </div>
            </div>

            {/* صورة التحويل */}
            {selectedRow.transferProof ? (
              <div className="mt-2">
                <h3 className="text-lg font-semibold mb-2">صورة التحويل البنكي</h3>
                <div className="rounded-lg border overflow-hidden">
                  <img
                    src={selectedRow.transferProof}
                    alt="Payment Proof"
                    className="w-full h-auto max-h-[420px] object-contain bg-black/5"
                  />
                </div>
                <a
                  href={selectedRow.transferProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-primary hover:underline text-sm"
                >
                  فتح الصورة في نافذة جديدة
                </a>
                <p className="text-xs text-muted-foreground mt-1">
                  * لن يتم تضمين صورة التحويل في PDF.
                </p>
              </div>
            ) : null}

            {/* Approve/Reject */}
            {canApproveReject ? (
              <div className="mt-4 p-4 rounded-lg border bg-muted/30">
                <div className="font-semibold mb-2">✅ موافقة التحويل (BANKAK)</div>

                <div className="flex flex-col md:flex-row gap-2 md:items-end">
                  <div className="flex-1">
                    <Label htmlFor="rejectReason">سبب الرفض (في حال الرفض)</Label>
                    <Input
                      id="rejectReason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="مثال: الإيصال غير واضح / المبلغ غير مطابق"
                      className="text-right"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                      {loading ? "..." : "قبول التحويل"}
                    </Button>
                    <Button onClick={handleReject} disabled={loading} variant="destructive">
                      {loading ? "..." : "رفض التحويل"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* تعديل الحالات (يدوي) */}
            <div className="grid gap-4 mt-4 md:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="paymentStatus" className="font-semibold">تعديل حالة الدفع</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger id="paymentStatus" className="w-full text-right">
                    <SelectValue placeholder="اختر حالة الدفع" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {paymentOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="deliveryStatus" className="font-semibold">تعديل حالة الطلب</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="deliveryStatus" className="w-full text-right">
                    <SelectValue placeholder="اختر حالة الطلب" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center py-4">جاري تحميل تفاصيل الطلب...</p>
        )}

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setIsModalOpen(false)} variant="outline">
            إغلاق
          </Button>

          {/* ✅ PDF button */}
          <Button onClick={handleSavePdf} variant="secondary" disabled={!selectedRow}>
            حفظ PDF (بدون صورة التحويل)
          </Button>

          <Button onClick={handleSaveChanges} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OrderDialog;

// ─────────────────────────────────────────────────────────────
// Utils for safe HTML in print template
// ─────────────────────────────────────────────────────────────
function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
