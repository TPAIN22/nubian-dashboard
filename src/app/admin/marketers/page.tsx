"use client";

import { useEffect, useState } from "react";
import {
  IconUsers,
  IconSearch,
  IconFilter,
  IconShieldCheck,
  IconShieldOff,
  IconExternalLink,
  IconUser,
  IconAffiliate,
  IconCash,
  IconEdit,
  IconTrash,
  IconChartBar,
  IconAlertTriangle,
  IconDotsVertical
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Label
} from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MarketersAdminPage() {
  const [marketers, setMarketers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Selected marketer for modals
  const [selectedMarketer, setSelectedMarketer] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    commissionRate: 0,
    discountRate: 0,
    status: "",
    phone: ""
  });

  useEffect(() => {
    fetchMarketers();
  }, []);

  const fetchMarketers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/marketers");
      const data = await res.json();
      if (res.ok) {
        setMarketers(data.data || []);
      } else {
        toast.error(data.message || "فشل تحميل قائمة المسوقين");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/marketers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(newStatus === 'active' ? "تم تفعيل الحساب بنجاح" : "تم إيقاف الحساب بنجاح");
        fetchMarketers();
      } else {
        toast.error("فشل تحديث الحالة");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    }
  };

  const deleteMarketer = async () => {
    if (!selectedMarketer) return;

    try {
      const res = await fetch(`/api/admin/marketers/${selectedMarketer._id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("تم حذف المسوق بنجاح");
        setIsDeleteOpen(false);
        fetchMarketers();
      } else {
        toast.error("فشل حذف المسوق");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    }
  };

  const updateMarketer = async () => {
    if (!selectedMarketer) return;

    try {
      const res = await fetch(`/api/admin/marketers/${selectedMarketer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      });

      if (res.ok) {
        toast.success("تم تحديث بيانات المسوق بنجاح");
        setIsEditOpen(false);
        fetchMarketers();
      } else {
        const data = await res.json().catch(() => null);
        const errorMsg = data?.error || data?.message || "فشل تحديث البيانات";
        const step = data?.step ? ` (Step: ${data.step})` : "";
        toast.error(`${errorMsg}${step}`);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    }
  };

  const fetchStats = async (marketer: any) => {
    setSelectedMarketer(marketer);
    setIsStatsOpen(true);
    try {
      setStatsLoading(true);
      const res = await fetch(`/api/admin/marketers/${marketer._id}/stats`);
      const data = await res.json();
      if (res.ok) {
        setStats(data.data);
      } else {
        toast.error("فشل تحميل الإحصائيات");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setStatsLoading(false);
    }
  };

  const openEditModal = (marketer: any) => {
    setSelectedMarketer(marketer);
    setEditFormData({
      name: marketer.name,
      commissionRate: marketer.commissionRate,
      discountRate: marketer.discountRate,
      status: marketer.status,
      phone: marketer.phone || ""
    });
    setIsEditOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SD", {
      style: "currency",
      currency: "SDG",
    }).format(amount);
  };

  const filteredMarketers = marketers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المسوقين</h1>
          <p className="text-muted-foreground mt-1 text-base">إدارة جميع المسوقين المشتركين في برنامج الإحالة.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-3">إجمالي المسوقين: {marketers.length}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>قائمة المسوقين</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الكود..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex gap-2">
              <IconFilter size={18} /> تصفية
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المسوق</TableHead>
                  <TableHead>الكود</TableHead>
                  <TableHead>إجمالي الأرباح</TableHead>
                  <TableHead>الأرباح المعلقة</TableHead>
                  <TableHead>الطلبات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left w-[100px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><div className="h-8 bg-muted animate-pulse rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMarketers.length > 0 ? (
                  filteredMarketers.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {m.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-xs text-muted-foreground">{m.phone || "بدون هاتف"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{m.code}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(m.totalEarnings)}</TableCell>
                      <TableCell className="text-amber-600">{formatCurrency(m.pendingEarnings)}</TableCell>
                      <TableCell>{m.totalOrders}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === 'active' ? 'default' : 'destructive'} className={m.status === 'active' ? 'bg-green-500' : ''}>
                          {m.status === 'active' ? 'نشط' : 'موقف'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDotsVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-right">خيارات المسوق</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center justify-end gap-2 cursor-pointer" onClick={() => fetchStats(m)}>
                              عرض الملف والإحصائيات <IconChartBar size={16} />
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center justify-end gap-2 cursor-pointer" onClick={() => openEditModal(m)}>
                              تعديل البيانات <IconEdit size={16} />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {m.status === 'active' ? (
                              <DropdownMenuItem
                                className="text-destructive flex items-center justify-end gap-2 cursor-pointer"
                                onClick={() => toggleStatus(m._id, m.status)}
                              >
                                إيقاف الحساب <IconShieldOff size={16} />
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600 flex items-center justify-end gap-2 cursor-pointer"
                                onClick={() => toggleStatus(m._id, m.status)}
                              >
                                تفعيل الحساب <IconShieldCheck size={16} />
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive flex items-center justify-end gap-2 cursor-pointer font-bold"
                              onClick={() => { setSelectedMarketer(m); setIsDeleteOpen(true); }}
                            >
                              حذف المسوق نهائياً <IconTrash size={16} />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا يوجد مسوقين مطابقين للبحث.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل بيانات المسوق</DialogTitle>
            <DialogDescription className="text-right">
              قم بتعديل بيانات المسوق والعمولة المقررة له.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-right">الاسم</Label>
              <Input
                id="name"
                value={editFormData.name}
                className="text-right"
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="commissionRate" className="text-right">نسبة العمولة (مثلاً 0.1 لـ 10%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  value={editFormData.commissionRate}
                  onChange={(e) => setEditFormData({ ...editFormData, commissionRate: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountRate" className="text-right">نسبة الخصم للزبون (مثلاً 0.1 لـ 10%)</Label>
                <Input
                  id="discountRate"
                  type="number"
                  step="0.01"
                  value={editFormData.discountRate}
                  onChange={(e) => setEditFormData({ ...editFormData, discountRate: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-right">رقم الهاتف</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                className="text-right"
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
            <Button onClick={updateMarketer}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 text-destructive">
              تأكيد الحذف <IconAlertTriangle size={20} />
            </DialogTitle>
            <DialogDescription className="text-right">
              هل أنت متأكد من حذف المسوق <strong>{selectedMarketer?.name}</strong>؟ هذا الإجراء سيقوم بحذف بيانات المسوق ولكنه سيحتفظ بالطلبات المرتبطة به.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={deleteMarketer}>حذف نهائي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Modal */}
      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إحصائيات المسوق: {selectedMarketer?.name}</DialogTitle>
            <DialogDescription className="text-right">
              نظرة مفصلة على أداء المسوق والطلبات التي تمت من خلال الكود {selectedMarketer?.code}.
            </DialogDescription>
          </DialogHeader>

          {statsLoading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full" />
              <p>جاري تحميل الإحصائيات...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6 py-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">إجمالي المبيعات</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.stats.totalSales)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">إجمالي العمولات</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.stats.totalEarnings)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">عدد الطلبات</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.stats.totalOrders}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Orders Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center justify-end gap-2">
                  آخر الطلبات المرتبطة <IconAffiliate size={20} />
                </h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الطلب</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">قيمة الطلب</TableHead>
                        <TableHead className="text-right">العمولة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.orders.length > 0 ? (
                        stats.orders.map((order: any) => (
                          <TableRow key={order._id}>
                            <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                            <TableCell className="text-xs">
                              {new Date(order.createdAt).toLocaleDateString('ar-SD')}
                            </TableCell>
                            <TableCell>{formatCurrency(order.finalAmount)}</TableCell>
                            <TableCell className="text-green-600 font-bold">{formatCurrency(order.marketerCommission)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            لا توجد طلبات مسجلة بعد.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button className="w-full" onClick={() => setIsStatsOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
