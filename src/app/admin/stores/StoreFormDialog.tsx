"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimpleImageUpload } from "@/components/simpleImageUpload";
import type { Store } from "./StoresTable";

type FormState = {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  description: string;
  merchantType: "individual" | "business";
  nationalId: string;
  crNumber: string;
  iban: string;
  logoUrl: string;
  banner: string;
};

const EMPTY: FormState = {
  storeName: "",
  ownerName: "",
  email: "",
  phone: "",
  city: "",
  description: "",
  merchantType: "individual",
  nationalId: "",
  crNumber: "",
  iban: "",
  logoUrl: "",
  banner: "",
};

const fromStore = (store: Store): FormState => ({
  storeName: store.storeName ?? "",
  ownerName: store.ownerName ?? "",
  email: store.email ?? "",
  phone: store.phone ?? "",
  city: store.city ?? "",
  description: store.description ?? "",
  merchantType: store.merchantType === "business" ? "business" : "individual",
  nationalId: store.nationalId ?? "",
  crNumber: store.crNumber ?? "",
  iban: store.iban ?? "",
  logoUrl: store.logoUrl ?? "",
  banner: store.banner ?? "",
});

/**
 * Create a store, or edit an existing one — claimed or not.
 *
 * Editing a claimed store rewrites data a real merchant owns and cannot see
 * being changed, so the dialog says so plainly. The backend audit-logs any
 * payout or identity field touched on a claimed store.
 */
export function StoreFormDialog({ store }: { store?: Store }) {
  const router = useRouter();
  const isEdit = Boolean(store);
  const isClaimed = store?.claimStatus === "claimed";

  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(store ? fromStore(store) : EMPTY);

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  // Re-seed on open so a cancelled edit doesn't leave stale values behind, and
  // so the form picks up a refreshed row after router.refresh().
  React.useEffect(() => {
    if (open) setForm(store ? fromStore(store) : EMPTY);
  }, [open, store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Empty optional strings would fail the backend's length validation, so send
    // undefined for anything the admin left blank.
    const optional = (v: string) => (v.trim() ? v.trim() : undefined);

    try {
      const res = await fetch(
        isEdit ? `/api/merchants/stores/${store!._id}` : "/api/merchants/stores",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName: form.storeName,
            ownerName: form.ownerName,
            email: form.email,
            city: form.city,
            description: form.description,
            merchantType: form.merchantType,
            phone: optional(form.phone),
            nationalId: optional(form.nationalId),
            crNumber: optional(form.crNumber),
            iban: optional(form.iban),
            // On edit an empty string is meaningful — it's how an admin clears
            // an existing image (the controller only applies keys that are
            // present). On create it would just persist "", so send undefined.
            logoUrl: isEdit ? form.logoUrl.trim() : optional(form.logoUrl),
            banner: isEdit ? form.banner.trim() : optional(form.banner),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل حفظ المتجر");

      toast.success(isEdit ? "تم تحديث بيانات المتجر." : "تم إنشاء المتجر. يمكنك الآن إضافة منتجاته.");
      if (!isEdit) setForm(EMPTY);
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "فشل حفظ المتجر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="sm" variant="ghost">
            <Pencil className="h-4 w-4 ms-1" />
            تعديل
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 ms-1" />
            إنشاء متجر
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `تعديل بيانات "${store!.storeName}"` : "إنشاء متجر نيابة عن تاجر"}
          </DialogTitle>
          <DialogDescription>
            {!isEdit
              ? "البريد الإلكتروني هو مفتاح الربط لاحقاً — استخدم البريد الذي سيسجّل به التاجر."
              : isClaimed
                ? "هذا المتجر مرتبط بحساب تاجر. أي تعديل هنا يغيّر بيانات يملكها التاجر دون علمه، ويُسجَّل تغيير البيانات البنكية وبيانات الهوية في سجل المراجعة."
                : "تغيير البريد الإلكتروني يغيّر الحساب الذي سيُربط بالمتجر."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">اسم المتجر <span className="text-red-500">*</span></Label>
            <Input
              id="storeName"
              required
              minLength={2}
              value={form.storeName}
              onChange={(e) => set({ storeName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName">اسم المالك <span className="text-red-500">*</span></Label>
              <Input
                id="ownerName"
                required
                minLength={2}
                value={form.ownerName}
                onChange={(e) => set({ ownerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                required
                dir="ltr"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                dir="ltr"
                placeholder="اختياري"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">المدينة <span className="text-red-500">*</span></Label>
              <Input
                id="city"
                required
                value={form.city}
                onChange={(e) => set({ city: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchantType">نوع التاجر</Label>
            <Select
              value={form.merchantType}
              onValueChange={(v) => set({ merchantType: v as FormState["merchantType"] })}
            >
              <SelectTrigger id="merchantType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">فرد</SelectItem>
                <SelectItem value="business">شركة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف المتجر <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              required
              rows={3}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>شعار المتجر</Label>
            <SimpleImageUpload
              value={form.logoUrl || undefined}
              onChange={(url) => set({ logoUrl: url ?? "" })}
            />
            <p className="text-xs text-muted-foreground">
              اختياري — يظهر بجانب اسم المتجر في التطبيق. يمكن للتاجر تغييره بعد ربط المتجر بحسابه.
            </p>
          </div>

          <div className="space-y-2">
            <Label>غلاف المتجر</Label>
            <SimpleImageUpload
              value={form.banner || undefined}
              onChange={(url) => set({ banner: url ?? "" })}
            />
            <p className="text-xs text-muted-foreground">
              اختياري — صورة عريضة (16:9، 1600×900 على الأقل) تظهر خلف رأس صفحة المتجر في التطبيق.
              إن تُركت فارغة يولّد التطبيق غلافاً من الشعار أو من اسم المتجر.
            </p>
          </div>

          <div className="rounded-lg border p-3 space-y-4">
            <p className="text-xs text-muted-foreground">
              بيانات التحقق والتحويل — اتركها فارغة إن لم تتوفر بعد، ويمكن للتاجر إكمالها بعد ربط المتجر بحسابه.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationalId">الرقم الوطني</Label>
                <Input
                  id="nationalId"
                  dir="ltr"
                  value={form.nationalId}
                  onChange={(e) => set({ nationalId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crNumber">رقم السجل التجاري</Label>
                <Input
                  id="crNumber"
                  dir="ltr"
                  value={form.crNumber}
                  onChange={(e) => set({ crNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                dir="ltr"
                value={form.iban}
                onChange={(e) => set({ iban: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin ms-1" />}
              {isEdit ? "حفظ التعديلات" : "إنشاء المتجر"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
