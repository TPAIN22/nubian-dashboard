'use client';

import React, { useEffect, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Percent, DollarSign, Calendar, Users, User } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiresAt: string;
  usageLimit: number;
  usageLimitPerUser: number;
  isActive: boolean;
}

interface CouponForm {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiresAt: string;
  usageLimit: number;
  usageLimitPerUser: number;
  isActive: boolean;
}

interface EditState {
  open: boolean;
  coupon: Coupon | null;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CouponForm>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    expiresAt: '',
    usageLimit: 1,
    usageLimitPerUser: 1,
    isActive: true,
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editState, setEditState] = useState<EditState>({ open: false, coupon: null });
  const [editForm, setEditForm] = useState<CouponForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/coupons');
      setCoupons(res.data);
      setError('');
    } catch (err) {
      toast.error("فشل في تحميل الكوبونات" , {
        description: err instanceof Error ? err.message : "خطأ غير معروف",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof CouponForm, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await axiosInstance.post('/coupons', {
        ...form,
        discountValue: Number(form.discountValue),
        usageLimit: Number(form.usageLimit),
        usageLimitPerUser: Number(form.usageLimitPerUser),
      });
      setForm({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        expiresAt: '',
        usageLimit: 1,
        usageLimitPerUser: 1,
        isActive: true,
      });
      setShowAddForm(false);
      fetchCoupons();
    } catch (err) {
      toast.error("فشل في إضافة الكوبون" , {
        description: err instanceof Error ? err.message : "خطأ غير معروف",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log("Deleting coupon with id:", id);
      console.log(process.env.NEXT_PUBLIC_API_URL);
      
      
      await axiosInstance.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      toast.error("فشل في حذف الكوبون" , {
        description: err instanceof Error ? err.message : "خطأ غير معروف",
      });
    }
  };

  const openEdit = (coupon: Coupon) => {
    setEditForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiresAt: coupon.expiresAt.slice(0, 10),
      usageLimit: coupon.usageLimit,
      usageLimitPerUser: coupon.usageLimitPerUser,
      isActive: coupon.isActive,
    });
    setEditState({ open: true, coupon });
    setEditError('');
  };

  const handleEditChange = (field: keyof CouponForm, value: string | number | boolean) => {
    setEditForm((prev) => prev ? ({
      ...prev,
      [field]: value,
    }) : null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState.coupon || !editForm) return;
    setEditLoading(true);
    setEditError('');
    try {
      await axiosInstance.put(`/coupons/${editState.coupon._id}`, {
        ...editForm,
        discountValue: Number(editForm.discountValue),
        usageLimit: Number(editForm.usageLimit),
        usageLimitPerUser: Number(editForm.usageLimitPerUser),
      });
      setEditState({ open: false, coupon: null });
      setEditForm(null);
      fetchCoupons();
    } catch (err) {
      toast.error("فشل في تعديل الكوبون" , {
        description: err instanceof Error ? err.message : "خطأ غير معروف",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">إدارة الكوبونات</h1>
          <p className="text-muted-foreground">إدارة كوبونات الخصم والعروض</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              إضافة كوبون جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>إضافة كوبون جديد</DialogTitle>
              <DialogDescription>
                أضف كوبون خصم جديد مع تحديد نوع الخصم والقيود
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">كود الكوبون</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => handleFormChange('code', e.target.value)}
                    placeholder="SAVE20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountType">نوع الخصم</Label>
                  <Select value={form.discountType} onValueChange={(value) => handleFormChange('discountType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية</SelectItem>
                      <SelectItem value="fixed">قيمة ثابتة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountValue">قيمة الخصم</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => handleFormChange('discountValue', Number(e.target.value))}
                    placeholder="10"
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">تاريخ الانتهاء</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => handleFormChange('expiresAt', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">حد الاستخدام الكلي</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => handleFormChange('usageLimit', Number(e.target.value))}
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usageLimitPerUser">حد الاستخدام لكل مستخدم</Label>
                  <Input
                    id="usageLimitPerUser"
                    type="number"
                    value={form.usageLimitPerUser}
                    onChange={(e) => handleFormChange('usageLimitPerUser', Number(e.target.value))}
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked: boolean) => handleFormChange('isActive', checked)}
                />
                <Label htmlFor="isActive">مفعل</Label>
              </div>
              {formError && (
                <Alert>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="w-full sm:w-auto">
                  إلغاء
                </Button>
                <Button type="submit" disabled={formLoading} className="w-full sm:w-auto">
                  {formLoading ? 'جاري الإضافة...' : 'إضافة الكوبون'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        /* Coupons Table */
        <Card>
          <CardHeader>
            <CardTitle>الكوبونات المتاحة</CardTitle>
            <CardDescription>قائمة بجميع كوبونات الخصم في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[700px] w-full text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الكود</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-right">حد الاستخدام</TableHead>
                    <TableHead className="text-right">حد المستخدم</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon._id}>
                      <TableCell className="font-medium">{coupon.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {coupon.discountType === 'percentage' ? (
                            <Percent className="w-4 h-4" />
                          ) : (
                            <DollarSign className="w-4 h-4" />
                          )}
                          {coupon.discountType === 'percentage' ? 'نسبة' : 'قيمة ثابتة'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.discountValue}
                        {coupon.discountType === 'percentage' ? '%' : ' ر.س'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(coupon.expiresAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {coupon.usageLimit}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {coupon.usageLimitPerUser}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                          {coupon.isActive ? 'مفعل' : 'غير مفعل'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف الكوبون &quot;{coupon.code}&quot; نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(coupon._id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editState.open} onOpenChange={(open) => setEditState({ open, coupon: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تعديل الكوبون</DialogTitle>
            <DialogDescription>
              تعديل بيانات الكوبون المحدد
            </DialogDescription>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">كود الكوبون</Label>
                  <Input
                    id="edit-code"
                    value={editForm.code}
                    onChange={(e) => handleEditChange('code', e.target.value)}
                    placeholder="SAVE20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-discountType">نوع الخصم</Label>
                  <Select value={editForm.discountType} onValueChange={(value) => handleEditChange('discountType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية</SelectItem>
                      <SelectItem value="fixed">قيمة ثابتة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-discountValue">قيمة الخصم</Label>
                  <Input
                    id="edit-discountValue"
                    type="number"
                    value={editForm.discountValue}
                    onChange={(e) => handleEditChange('discountValue', Number(e.target.value))}
                    placeholder="10"
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expiresAt">تاريخ الانتهاء</Label>
                  <Input
                    id="edit-expiresAt"
                    type="date"
                    value={editForm.expiresAt}
                    onChange={(e) => handleEditChange('expiresAt', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-usageLimit">حد الاستخدام الكلي</Label>
                  <Input
                    id="edit-usageLimit"
                    type="number"
                    value={editForm.usageLimit}
                    onChange={(e) => handleEditChange('usageLimit', Number(e.target.value))}
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-usageLimitPerUser">حد الاستخدام لكل مستخدم</Label>
                  <Input
                    id="edit-usageLimitPerUser"
                    type="number"
                    value={editForm.usageLimitPerUser}
                    onChange={(e) => handleEditChange('usageLimitPerUser', Number(e.target.value))}
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={editForm.isActive}
                  onCheckedChange={(checked: boolean) => handleEditChange('isActive', checked)}
                />
                <Label htmlFor="edit-isActive">مفعل</Label>
              </div>
              
              {editError && (
                <Alert>
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditState({ open: false, coupon: null })}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}