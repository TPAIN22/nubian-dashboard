import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // أضفنا DialogDescription لتحسين الوصف
  DialogFooter, // أضفنا DialogFooter للأزرار
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // نحتاج زر الحفظ
import { updateOrders } from "@/app/orders/orderControler";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Label } from "@/components/ui/label"; // لاستخدام Label مع Select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // استخدم مكون Select من shadcn/ui

// استيراد نوع Order ودوال المساعدة من ملف ordersTable.tsx
// تأكد من المسار الصحيح لملف ordersTable.tsx بناءً على مكان هذا الملف.
import {
  Order, // استوردنا Order type
  getStatusInArabic,
  getPaymentStatusInArabic,
  formatDate,
} from "./ordersTable"; // تم التأكيد على أن هذا هو اسم الملف الصحيح الآن

// قائمة بالخيارات المتاحة للحالة
const statusOptions = [
  { value: "pending", label: "بانتظار التأكيد" },
  { value: "confirmed", label: "تم التأكيد" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التوصيل" },
  { value: "cancelled", label: "ملغي" },
];

// قائمة بالخيارات المتاحة لحالة الدفع
const paymentOptions = [
  { value: "pending", label: "دفع عند الاستلام" },
  { value: "paid", label: "مدفوع" },
  { value: "failed", label: "فشل" },
];

interface OrderDialogProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  selectedRow: Order | null; // حدد نوع selectedRow بشكل صحيح
}

function OrderDialog({
  isModalOpen,
  setIsModalOpen,
  selectedRow,
}: OrderDialogProps) {
  const [status, setStatus] = useState(selectedRow?.status || "");
  const [paymentStatus, setPaymentStatus] = useState(
    selectedRow?.paymentStatus || ""
  );
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  // قم بتحديث state عندما يتغير selectedRow
  useEffect(() => {
    if (selectedRow) {
      setStatus(selectedRow.status || "");
      setPaymentStatus(selectedRow.paymentStatus || "");
    }
  }, [selectedRow]);

  const handleUpdateStatus = async () => {
    if (!selectedRow) return;

    setLoading(true);
    const token = await getToken();

    try {
      const updatedData: Partial<Order> = {}; // استخدم Partial لأننا نرسل جزءًا من الكائن
      const oldStatus = selectedRow.status;
      const oldPaymentStatus = selectedRow.paymentStatus;

      let changesMade = false;
      if (status !== oldStatus) {
        updatedData.status = status as Order["status"]; // تأكد من النوع
        changesMade = true;
      }
      if (paymentStatus !== oldPaymentStatus) {
        updatedData.paymentStatus = paymentStatus as Order["paymentStatus"]; // تأكد من النوع
        changesMade = true;
      }

      if (!changesMade) {
        toast.error("لم يتم إجراء أي تغييرات.");
        setLoading(false);
        return;
      }

      // الخطوة 1: تحديث الطلب في قاعدة البيانات
      console.log("Updating database with:", {
        _id: selectedRow._id,
        ...updatedData,
      });
      await updateOrders(
        {
          _id: selectedRow._id,
          ...updatedData,
        },
        token
      );
      toast.success("تم تحديث الطلب بنجاح.");

      const emailData = {
        user: {
          id: selectedRow.user._id, // تأكد من وجود ID للمستخدم
          fullName: selectedRow.customerInfo?.name || "غير محدد", // استخدم customerInfo
          emailAddress: selectedRow.customerInfo?.email || "غير محدد", // استخدم customerInfo
        },
        orderNumber: selectedRow.orderNumber,
        totalAmount: selectedRow.totalAmount,
        products:
          selectedRow.productsDetails && selectedRow.productsDetails.length > 0
            ? selectedRow.productsDetails
            : selectedRow.products,
        oldStatus: oldStatus,
        newStatus: status,
        paymentStatus: paymentStatus,
      };

      try {
        const emailResponse = await fetch("/api/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          toast.warning(
            `تم تحديث الطلب، لكن فشل إرسال الإشعار بالبريد الإلكتروني: ${errorData.message || "خطأ غير معروف"}`
          );
        } else {
          toast.success("تم إرسال إشعار البريد الإلكتروني بنجاح.");
        }
      } catch (emailErr: any) {
        console.error("Error sending email notification:", emailErr);
        toast.warning(
          `تم تحديث الطلب، لكن حدث خطأ أثناء إرسال الإشعار بالبريد الإلكتروني: ${emailErr.message || "خطأ غير معروف"}`
        );
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error during order update process:", err);
      toast.error(`حدث خطأ أثناء التحديث: ${err.message || "خطأ غير معروف"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-right">
          {" "}
          {/* محاذاة لليمين */}
          <DialogTitle>تفاصيل الطلب</DialogTitle>
          <DialogDescription>
            عرض وتحديث حالة الطلب رقم: {selectedRow?.orderNumber || "N/A"}
          </DialogDescription>
        </DialogHeader>

        {selectedRow ? (
          <div className="grid gap-4 py-4 text-right">
            {" "}
            {/* محاذاة لليمين */}
            {/* معلومات العميل والطلب */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <p>
                <span className="font-semibold">رقم الطلب:</span>{" "}
                {selectedRow.orderNumber}
              </p>
              <p>
                <span className="font-semibold">اسم العميل:</span>{" "}
                {selectedRow.customerInfo?.name || "غير محدد"}
              </p>
              <p>
                <span className="font-semibold">البريد الإلكتروني:</span>{" "}
                {selectedRow.customerInfo?.email || "غير محدد"}
              </p>
              <p>
                <span className="font-semibold">رقم الهاتف:</span>{" "}
                {selectedRow.phoneNumber ||
                  selectedRow.customerInfo?.phone ||
                  "غير محدد"}
              </p>
              <p className="md:col-span-2">
                <span className="font-semibold">العنوان:</span>{" "}
                {`${selectedRow.address}, ${selectedRow.city}`}
              </p>
              <p>
                <span className="font-semibold">تاريخ الطلب:</span>{" "}
                {formatDate(selectedRow.orderDate)}
              </p>
              <p>
                <span className="font-semibold">إجمالي المبلغ:</span>{" "}
                {new Intl.NumberFormat("en-SD", {
                  minimumFractionDigits: 2,
                }).format(selectedRow.totalAmount)}{" "}
                ج.س
              </p>
            </div>
            {/* حالة الدفع */}
            <div className="grid gap-1 mt-4">
              <Label htmlFor="paymentStatus" className="font-semibold">
                حالة الدفع:{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedRow.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : selectedRow.paymentStatus === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {getPaymentStatusInArabic(selectedRow.paymentStatus)}
                </span>
              </Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger
                  id="paymentStatus"
                  className="w-[180px] text-right"
                >
                  <SelectValue placeholder="اختر حالة الدفع" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {paymentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* حالة التوصيل */}
            <div className="grid gap-1 mt-4">
              <Label htmlFor="deliveryStatus" className="font-semibold">
                حالة التوصيل:{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedRow.status === "delivered"
                      ? "bg-green-100 text-green-800"
                      : selectedRow.status === "shipped"
                        ? "bg-blue-100 text-blue-800"
                        : selectedRow.status === "confirmed"
                          ? "bg-yellow-100 text-yellow-800"
                          : selectedRow.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {getStatusInArabic(selectedRow.status)}
                </span>
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  id="deliveryStatus"
                  className="w-[180px] text-right"
                >
                  <SelectValue placeholder="اختر حالة التوصيل" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* تفاصيل المنتجات */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">المنتجات:</h3>
              {selectedRow.productsDetails &&
              selectedRow.productsDetails.length > 0 ? (
                <ul className="space-y-2 pr-5">
                  {selectedRow.productsDetails.map((p: any, i: number) => (
                    <li
                      key={i}
                      className="flex justify-between items-center bg-gray-50 p-3 text-black rounded-md shadow-sm"
                    >
                      <span className="font-medium">
                        {p.name || "منتج غير معروف"}
                      </span>
                      <span>الكمية: {p.quantity || 1}</span>
                      <span>
                        السعر:{" "}
                        {new Intl.NumberFormat("en-SD", {
                          minimumFractionDigits: 2,
                        }).format(p.price * p.quantity || 0)}{" "}
                        ج.س
                      </span>
                    </li>
                  ))}
                </ul>
              ) : selectedRow.products && selectedRow.products.length > 0 ? (
                // Fallback if productsDetails is not available but products is
                <ul className="space-y-2 pr-5">
                  {selectedRow.products.map((p: any, i: number) => (
                    <li
                      key={i}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-md shadow-sm"
                    >
                      <span className="font-medium">
                        {p.product?.name || "منتج غير معروف"}
                      </span>
                      <span>الكمية: {p.quantity || 1}</span>
                      <span>
                        السعر:{" "}
                        {new Intl.NumberFormat("en-SD", {
                          minimumFractionDigits: 2,
                        }).format(p.product?.price * p.quantity || 0)}{" "}
                        ج.س
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  لا توجد منتجات لهذا الطلب.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center py-4">جاري تحميل تفاصيل الطلب...</p>
        )}

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setIsModalOpen(false)} variant="outline">
            إلغاء
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "جاري التحديث..." : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OrderDialog;
