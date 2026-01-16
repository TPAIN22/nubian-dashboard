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
import jsPDF from "jspdf";
import { convertArabic } from "arabic-reshaper";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Order } from "./types";
import { getStatusInArabic, getPaymentStatusInArabic, formatDate } from "./types";

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

  // ✅ Save as PDF (direct jsPDF approach - no CSS issues)
  const handleSavePdf = async () => {
    if (!selectedRow) return;

    try {
      toast.loading("جاري إنشاء ملف PDF...");

      const orderId = selectedRow.orderNumber || selectedRow._id;
      const created = formatDate(selectedRow.createdAt || selectedRow.orderDate);
      const couponCode = (selectedRow as any)?.couponDetails?.code || "";
      const discountAmount = totals.discount || 0;

      // Create PDF directly with jsPDF (no html2canvas issues)
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Load Arabic font
      try {
        const fontResponse = await fetch('/fonts/NotoSansArabic-Regular.ttf');
        const fontArrayBuffer = await fontResponse.arrayBuffer();
        const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontArrayBuffer)));
        pdf.addFileToVFS('NotoSansArabic-Regular.ttf', fontBase64);
        pdf.addFont('NotoSansArabic-Regular.ttf', 'NotoSansArabic', 'normal');
      } catch (fontError) {
        console.warn('Failed to load Arabic font, using default font:', fontError);
      }

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      let yPosition = 30;

      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text('Nubian • Order Summary', margin, yPosition);
      yPosition += 10;

      // Try to use Arabic font for Arabic text
      try {
        pdf.setFont('NotoSansArabic', 'normal');
      } catch {
        pdf.setFont('helvetica', 'normal');
      }
      pdf.setFontSize(10);
      const arabicHeader = convertArabic('تم إنشاء هذا الملخص للحفظ كـ PDF');
      pdf.text(arabicHeader, margin, yPosition);
      yPosition += 15;

      // Order info (right aligned)
      pdf.setFontSize(10);
      const orderIdText = convertArabic(`رقم الطلب: ${orderId}`);
      const dateText = convertArabic(`التاريخ: ${created}`);
      pdf.text(orderIdText, pageWidth - margin, 25, { align: 'right' });
      pdf.text(dateText, pageWidth - margin, 32, { align: 'right' });

      // Customer Information Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('معلومات العميل', margin, yPosition);
      yPosition += 10;

      try {
        pdf.setFont('NotoSansArabic', 'normal');
      } catch {
        pdf.setFont('helvetica', 'normal');
      }
      pdf.setFontSize(10);

      // Customer details
      const customerName = addressBlock?.fullName || "غير محدد";
      const customerEmail = selectedRow.customerInfo?.email || "—";
      const customerPhone = addressBlock?.phone || "—";
      const customerWhatsapp = addressBlock?.whatsapp || "—";
      const customerAddress = addressBlock?.fullAddress || "—";

      pdf.text(convertArabic(`الاسم: ${customerName}`), margin, yPosition);
      pdf.text(`البريد: ${customerEmail}`, margin + 80, yPosition);
      yPosition += 7;

      pdf.text(convertArabic(`الهاتف: ${customerPhone}`), margin, yPosition);
      pdf.text(convertArabic(`واتساب: ${customerWhatsapp}`), margin + 80, yPosition);
      yPosition += 7;

      // Wrap long addresses
      const addressLines = pdf.splitTextToSize(convertArabic(`العنوان: ${customerAddress}`), 100);
      pdf.text(addressLines, margin, yPosition);
      yPosition += addressLines.length * 5 + 5;

      // Order Status Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('حالة الطلب', margin, yPosition);
      yPosition += 10;

      try {
        pdf.setFont('NotoSansArabic', 'normal');
      } catch {
        pdf.setFont('helvetica', 'normal');
      }
      pdf.setFontSize(10);

      const orderStatus = getStatusInArabic(String(selectedRow.status || ""));
      const paymentMethod = selectedRow.paymentMethod || "—";
      const paymentStatus = getPaymentStatusInArabic(String(selectedRow.paymentStatus || ""));

      pdf.text(convertArabic(`حالة الطلب: ${orderStatus}`), margin, yPosition);
      pdf.text(convertArabic(`طريقة الدفع: ${paymentMethod}`), margin + 80, yPosition);
      yPosition += 7;
      pdf.text(convertArabic(`حالة الدفع: ${paymentStatus}`), margin, yPosition);
      yPosition += 10;

      // Coupon info if exists
      if (couponCode) {
        pdf.text(convertArabic(`كوبون الخصم: ${couponCode}`), margin, yPosition);
        if (discountAmount > 0) {
          pdf.text(convertArabic(`قيمة الخصم: ${money(discountAmount)} ج.س`), margin + 80, yPosition);
        }
        yPosition += 10;
      }

      // Products Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('المنتجات', margin, yPosition);
      yPosition += 10;

      // Table headers
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('#', margin, yPosition);
      pdf.text(convertArabic('المنتج'), margin + 15, yPosition);
      pdf.text(convertArabic('الكمية'), margin + 100, yPosition);
      pdf.text(convertArabic('السعر'), margin + 130, yPosition);
      pdf.text(convertArabic('الإجمالي'), margin + 160, yPosition);

      // Header line
      pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
      yPosition += 8;

      // Products
      pdf.setFont('helvetica', 'normal');
      normalizedProducts.forEach((product, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 30;
        }

        const lineTotal = Number(product.price || 0) * Number(product.quantity || 0);
        const productName = product.name.substring(0, 25); // Truncate long names

        pdf.text(`${index + 1}`, margin, yPosition);
        pdf.text(productName, margin + 15, yPosition);
        pdf.text(`${product.quantity}`, margin + 100, yPosition);
        pdf.text(`${money(product.price)} ج.س`, margin + 130, yPosition);
        pdf.text(`${money(lineTotal)} ج.س`, margin + 160, yPosition);

        yPosition += 6;
      });

      yPosition += 10;

      // Totals Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);

      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 30;
      }

      pdf.text(convertArabic('المجموع الفرعي:'), margin + 100, yPosition);
      pdf.text(`${money(totals.subtotal)} ج.س`, margin + 160, yPosition);
      yPosition += 8;

      pdf.text(convertArabic('الشحن:'), margin + 100, yPosition);
      pdf.text(`${money(totals.shipping)} ج.س`, margin + 160, yPosition);
      yPosition += 8;

      if (totals.discount > 0) {
        pdf.text(convertArabic('الخصم:'), margin + 100, yPosition);
        pdf.text(`-${money(totals.discount)} ج.س`, margin + 160, yPosition);
        yPosition += 8;
      }

      // Total line
      pdf.line(margin + 90, yPosition - 2, pageWidth - margin, yPosition - 2);
      yPosition += 5;

      pdf.setFontSize(12);
      pdf.text(convertArabic('الإجمالي النهائي:'), margin + 100, yPosition);
      pdf.text(`${money(totals.final)} ج.س`, margin + 160, yPosition);

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Order: ${orderId} - Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      // Save the PDF
      pdf.save(`Order-${orderId}.pdf`);

      toast.dismiss();
      toast.success("تم تحميل ملف PDF بنجاح!");

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss();
      toast.error("فشل في إنشاء ملف PDF. حاول مرة أخرى.");
    }
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
