"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

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

type FormState = {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  description: string;
  merchantType: "individual" | "business";
};

const EMPTY: FormState = {
  storeName: "",
  ownerName: "",
  email: "",
  phone: "",
  city: "",
  description: "",
  merchantType: "individual",
};

export function CreateStoreDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/merchants/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Send only what the admin actually filled in — empty strings would
          // fail the backend's length validation on optional fields.
          phone: form.phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل إنشاء المتجر");

      toast.success("تم إنشاء المتجر. يمكنك الآن إضافة منتجاته.");
      setForm(EMPTY);
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "فشل إنشاء المتجر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ms-1" />
          إنشاء متجر
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء متجر نيابة عن تاجر</DialogTitle>
          <DialogDescription>
            البريد الإلكتروني هو مفتاح الربط لاحقاً — استخدم البريد الذي سيسجّل به التاجر.
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

          <p className="text-xs text-muted-foreground">
            الهوية الوطنية و IBAN غير مطلوبة الآن — يكملها التاجر بعد ربط المتجر بحسابه.
          </p>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin ms-1" />}
              إنشاء المتجر
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
