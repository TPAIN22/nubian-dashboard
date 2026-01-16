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
import html2canvas from "html2canvas";

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

  // ✅ Save as PDF (HTML template approach for proper Arabic support)
  const handleSavePdf = async () => {
    if (!selectedRow) return;

    try {
      toast.loading("جاري إنشاء ملف PDF...");

      const orderId = selectedRow.orderNumber || selectedRow._id;
      const created = formatDate(selectedRow.createdAt || selectedRow.orderDate);
      const couponCode = (selectedRow as any)?.couponDetails?.code || "";
      const discountAmount = totals.discount || 0;

      // Create HTML template with proper Arabic text and RTL support (using only basic CSS colors)
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Noto Sans Arabic', Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: black;
              direction: rtl;
            }
            .container {
              width: 800px;
              margin: 0 auto;
              padding: 20px;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333333;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              color: #333333;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #666666;
              font-size: 12px;
            }
            .order-info {
              position: absolute;
              top: 20px;
              left: 20px;
              font-size: 10px;
              color: #666666;
            }
            .section {
              margin-bottom: 20px;
              padding: 15px;
              border-radius: 8px;
            }
            .customer-info {
              background: #f9f9f9;
            }
            .order-status {
              background: #f0f8ff;
            }
            .totals {
              background: #fff8dc;
              border: 2px solid #ffa500;
            }
            .section h2 {
              margin: 0 0 10px 0;
              color: #333333;
              font-size: 16px;
              border-bottom: 1px solid #dddddd;
              padding-bottom: 5px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #dddddd;
              padding: 8px;
            }
            th {
              background: #f0f0f0;
              font-weight: bold;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .flex {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .discount { color: #d32f2f; }
            .total { font-size: 18px; font-weight: bold; color: #2e7d32; }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #dddddd;
              color: #666666;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>نوبيان • ملخص الطلب</h1>
              <p>تم إنشاء هذا الملخص للحفظ كـ PDF</p>
              <div class="order-info">
                <div>رقم الطلب: ${orderId}</div>
                <div>التاريخ: ${created}</div>
              </div>
            </div>

            <!-- Customer Information -->
            <div class="section customer-info">
              <h2>معلومات العميل</h2>
              <div class="grid">
                <div><strong>الاسم:</strong> ${addressBlock?.fullName || "غير محدد"}</div>
                <div><strong>البريد:</strong> ${selectedRow.customerInfo?.email || "—"}</div>
                <div><strong>الهاتف:</strong> ${addressBlock?.phone || "غير محدد"}</div>
                <div><strong>واتساب:</strong> ${addressBlock?.whatsapp || "غير محدد"}</div>
              </div>
              <div style="margin-top: 10px;">
                <strong>العنوان:</strong> ${addressBlock?.fullAddress || "—"}
              </div>
            </div>

            <!-- Order Status -->
            <div class="section order-status">
              <h2>حالة الطلب</h2>
              <div class="grid">
                <div><strong>حالة الطلب:</strong> ${getStatusInArabic(String(selectedRow.status || ""))}</div>
                <div><strong>طريقة الدفع:</strong> ${selectedRow.paymentMethod || "—"}</div>
                <div><strong>حالة الدفع:</strong> ${getPaymentStatusInArabic(String(selectedRow.paymentStatus || ""))}</div>
                ${couponCode ? `<div><strong>كوبون الخصم:</strong> ${couponCode}</div>` : '<div></div>'}
              </div>
              ${discountAmount > 0 ? `<div style="margin-top: 10px;"><strong>قيمة الخصم:</strong> ${money(discountAmount)} ج.س</div>` : ''}
            </div>

            <!-- Products -->
            <div class="section">
              <h2>المنتجات (${normalizedProducts.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th style="width: 5%;" class="text-center">#</th>
                    <th class="text-right">المنتج</th>
                    <th style="width: 15%;" class="text-center">الكمية</th>
                    <th style="width: 20%;" class="text-center">السعر</th>
                    <th style="width: 20%;" class="text-center">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${normalizedProducts.map((product, index) => {
                    const lineTotal = Number(product.price || 0) * Number(product.quantity || 0);
                    return `
                      <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>${product.name}</td>
                        <td class="text-center">${product.quantity}</td>
                        <td class="text-center">${money(product.price)} ج.س</td>
                        <td class="text-center">${money(lineTotal)} ج.س</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="section totals">
              <h2 style="text-align: center;">ملخص المبالغ</h2>
              <div class="flex" style="margin-bottom: 10px;">
                <span><strong>المجموع الفرعي:</strong></span>
                <span>${money(totals.subtotal)} ج.س</span>
              </div>
              <div class="flex" style="margin-bottom: 10px;">
                <span><strong>الشحن:</strong></span>
                <span>${money(totals.shipping)} ج.س</span>
              </div>
              ${totals.discount > 0 ? `
                <div class="flex discount" style="margin-bottom: 10px;">
                  <span><strong>الخصم:</strong></span>
                  <span>-${money(totals.discount)} ج.س</span>
                </div>
              ` : ''}
              <hr style="border: none; border-top: 2px solid #333333; margin: 10px 0;">
              <div class="flex total">
                <span><strong>الإجمالي النهائي:</strong></span>
                <span>${money(totals.final)} ج.س</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              تم إنشاء هذا التقرير بواسطة نظام نوبيان • Order: ${orderId}
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a new iframe to isolate the HTML content completely
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = '2000px';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Unable to access iframe document');
      }

      // Write the HTML content to the iframe
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for the iframe content to load and fonts to be ready
      await new Promise((resolve) => {
        const checkReady = () => {
          if (iframeDoc.readyState === 'complete') {
            // Wait a bit more for fonts to load
            setTimeout(resolve, 1500);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });

      // Get the content element from the iframe
      const contentElement = iframeDoc.querySelector('.container') as HTMLElement;
      if (!contentElement) {
        throw new Error('Container element not found');
      }

      // Generate canvas from the iframe content
      const canvas = await html2canvas(contentElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: contentElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: contentElement.scrollHeight
      });

      // Remove the iframe
      document.body.removeChild(iframe);

      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = 10;
      let remainingHeight = imgHeight;

      // Handle multi-page PDF if content is too tall
      while (remainingHeight > 0) {
        const pageHeight = Math.min(remainingHeight, pdfHeight - 20);

        pdf.addImage(
          imgData,
          'PNG',
          10,
          yPosition,
          imgWidth,
          pageHeight,
          undefined,
          'FAST'
        );

        remainingHeight -= pdfHeight - 20;
        yPosition = 10;

        if (remainingHeight > 0) {
          pdf.addPage();
        }
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
