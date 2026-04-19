"use client";

import { useEffect, useState } from "react";
import { 
  IconCash, 
  IconFilter, 
  IconUsers, 
  IconCheck, 
  IconAlertCircle,
  IconLoader2,
  IconClock,
  IconX
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function CommissionsAdminPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutDialog, setPayoutDialog] = useState<{ open: boolean; commission: any | null }>({
    open: false,
    commission: null
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const res = await fetch("/api/admin/commissions");
      const data = await res.json();
      if (res.ok) {
        setCommissions(data.data || []);
      } else {
        toast.error("فشل تحميل قائمة العمولات");
      }
    } catch (error) {
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async () => {
    if (!payoutDialog.commission) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/commissions/${payoutDialog.commission._id}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });

      if (res.ok) {
        toast.success("تم تأكيد دفع العمولة بنجاح");
        setPayoutDialog({ open: false, commission: null });
        setNotes("");
        fetchCommissions();
      } else {
        const err = await res.json();
        toast.error(err.message || "فشل تأكيد الدفع");
      }
    } catch (error) {
      toast.error("خطأ أثناء معالجة الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SD", {
      style: "currency",
      currency: "SDG",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500">تم الدفع</Badge>;
      case "pending": return <Badge variant="outline" className="text-amber-600 border-amber-600">قيد الانتظار</Badge>;
      case "approved": return <Badge variant="secondary">معتمد</Badge>;
      case "rejected": return <Badge variant="destructive">مرفوض</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">العمولات والمدفوعات</h1>
          <p className="text-muted-foreground mt-1 text-base">إدارة صرف العمولات للمسوقين ومعالجة طلبات السحب.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium">بانتظار الصرف</CardTitle>
               <IconClock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(commissions.filter(c => c.status === 'pending').reduce((acc, c) => acc + c.amount, 0))}
               </div>
               <p className="text-xs text-muted-foreground mt-1">تتطلب مراجعة أو تأكيد دفع</p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium">تم دفعه (الشهر الحالي)</CardTitle>
               <IconCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(commissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.amount, 0))}
               </div>
               <p className="text-xs text-muted-foreground mt-1">مدفوعات ناجحة للمسوقين</p>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>سجل العمولات</CardTitle>
            <Button variant="outline" size="sm" className="flex gap-2">
              <IconFilter size={16} /> تصفية
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المسوق</TableHead>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>قيمة الطلب</TableHead>
                  <TableHead>العمولة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
                ) : commissions.length > 0 ? (
                  commissions.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium text-primary">@{c.marketer?.code}</TableCell>
                      <TableCell className="text-xs">#{c.order?.orderNumber}</TableCell>
                      <TableCell>{formatCurrency(c.orderAmount)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(c.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString("ar-SD")}
                      </TableCell>
                      <TableCell>{getStatusBadge(c.status)}</TableCell>
                      <TableCell className="text-left">
                        {c.status === 'pending' ? (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="bg-primary/10 text-primary hover:bg-primary/20 h-8"
                            onClick={() => setPayoutDialog({ open: true, commission: c })}
                          >
                            تأكيد الدفع
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">مكتمل</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 italic">لا توجد بيانات متاحة حالياً.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payout Dialog */}
      <Dialog open={payoutDialog.open} onOpenChange={(open) => !open && setPayoutDialog({ open, commission: null })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد صرف العمولة</DialogTitle>
            <DialogDescription>
              سيتم تسجيل أنك قمت بتحويل العمولة للمسوق <strong>{payoutDialog.commission?.marketer?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
             <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium">المبلغ المستحق:</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(payoutDialog.commission?.amount || 0)}</span>
             </div>
             
             <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات (اختياري)</label>
                <Textarea 
                  placeholder="أدخل تفاصيل التحويل أو ملاحظات إضافية..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
             </div>

             <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
                <IconAlertCircle className="shrink-0 mt-0.5" size={16} />
                <p>تأكد من قيامك بالتحويل الفعلي للمبلغ قبل النقر على زر التأكيد.</p>
             </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setPayoutDialog({ open: false, commission: null })}>إلغاء</Button>
            <Button onClick={handlePayout} disabled={submitting}>
               {submitting && <IconLoader2 className="ml-2 h-4 w-4 animate-spin" />}
               تأكيد الصرف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
