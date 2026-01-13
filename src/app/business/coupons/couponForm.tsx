"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@clerk/nextjs";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const couponSchema = z.object({
  code: z.string().min(1, "الكود مطلوب").max(50, "الكود طويل جداً"),
  type: z.enum(["percentage", "fixed"], {
    required_error: "نوع الخصم مطلوب",
  }),
  value: z.number().min(0.01, "القيمة يجب أن تكون أكبر من 0"),
  minOrderAmount: z.number().min(0),
  maxDiscount: z.number().min(0).optional().nullable(),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  usageLimitPerUser: z.number().min(0),
  usageLimitGlobal: z.number().min(0).optional().nullable(),
  applicableProducts: z.array(z.string()),
  applicableCategories: z.array(z.string()),
  applicableMerchants: z.array(z.string()),
  isActive: z.boolean(),
}).refine((data) => {
  if (data.type === "percentage" && data.value > 100) {
    return false;
  }
  return true;
}, {
  message: "نسبة الخصم لا يمكن أن تتجاوز 100%",
  path: ["value"],
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: "تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية",
  path: ["endDate"],
});

interface CouponFormProps {
  coupon?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CouponForm({ coupon, onSuccess, onCancel }: CouponFormProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [merchants, setMerchants] = React.useState<any[]>([]);

  const form = useForm<z.infer<typeof couponSchema>>({
    resolver: zodResolver(couponSchema),
    defaultValues: coupon
      ? {
          code: coupon.code || "",
          type: coupon.type || coupon.discountType || "percentage",
          value: coupon.value || coupon.discountValue || 0,
          minOrderAmount: coupon.minOrderAmount || 0,
          maxDiscount: coupon.maxDiscount || null,
          startDate: coupon.startDate
            ? new Date(coupon.startDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          endDate: coupon.endDate || coupon.expiresAt
            ? new Date(coupon.endDate || coupon.expiresAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          usageLimitPerUser: coupon.usageLimitPerUser || 1,
          usageLimitGlobal: coupon.usageLimitGlobal || coupon.usageLimit || null,
          applicableProducts: coupon.applicableProducts?.map((p: any) => p._id || p) || [],
          applicableCategories: coupon.applicableCategories?.map((c: any) => c._id || c) || [],
          applicableMerchants: coupon.applicableMerchants?.map((m: any) => m._id || m) || [],
          isActive: coupon.isActive !== false,
        }
      : {
          code: "",
          type: "percentage",
          value: 10,
          minOrderAmount: 0,
          maxDiscount: null,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          usageLimitPerUser: 1,
          usageLimitGlobal: null,
          applicableProducts: [],
          applicableCategories: [],
          applicableMerchants: [],
          isActive: true,
        },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        
        // Fetch products, categories, merchants for selection
        const [productsRes, categoriesRes, merchantsRes] = await Promise.all([
          axiosInstance.get("/products?limit=100", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axiosInstance.get("/categories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axiosInstance.get("/merchants", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (productsRes.data?.success) {
          setProducts(productsRes.data.data || []);
        }
        if (categoriesRes.data?.success) {
          setCategories(categoriesRes.data.data || []);
        }
        if (merchantsRes.data?.success) {
          setMerchants(merchantsRes.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [getToken]);

  const onSubmit = async (values: z.infer<typeof couponSchema>) => {
    try {
      setLoading(true);
      const token = await getToken();

      const dataToSend = {
        ...values,
        code: values.code.toUpperCase().trim(),
        maxDiscount: values.maxDiscount || null,
        usageLimitGlobal: values.usageLimitGlobal || null,
      };

      if (coupon) {
        await axiosInstance.put(`/coupons/${coupon._id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("تم تحديث الكوبون بنجاح");
      } else {
        await axiosInstance.post("/coupons", dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("تم إنشاء الكوبون بنجاح");
      }

      onSuccess();
    } catch (error: any) {
      toast.error("فشل حفظ الكوبون", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Watch form values
  const type = useWatch({ control: form.control, name: "type" });
  const value = useWatch({ control: form.control, name: "value" });
  const maxDiscount = useWatch({ control: form.control, name: "maxDiscount" });
  const minOrderAmount = useWatch({ control: form.control, name: "minOrderAmount" });

  const discountPreview = React.useMemo(() => {
    const orderAmount = 1000; // Example amount for preview
    const valueNum = value || 0;
    const minOrderAmountNum = minOrderAmount || 0;

    if (orderAmount < minOrderAmountNum) {
      return { discountAmount: 0, finalAmount: orderAmount };
    }

    let discountAmount = 0;
    if (type === "percentage") {
      discountAmount = (orderAmount * valueNum) / 100;
      if (maxDiscount && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      discountAmount = valueNum;
    }

    return {
      discountAmount: Math.min(discountAmount, orderAmount),
      finalAmount: Math.max(0, orderAmount - discountAmount),
    };
  }, [type, value, maxDiscount, minOrderAmount]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>كود الكوبون *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="SUMMER2024"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع الخصم *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">قيمة ثابتة (ج.س)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>قيمة الخصم *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  {form.watch("type") === "percentage"
                    ? "النسبة المئوية (0-100%)"
                    : "القيمة بالجنيه السوداني"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minOrderAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحد الأدنى للطلب</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>0 يعني لا يوجد حد أدنى</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.watch("type") === "percentage" && (
          <FormField
            control={form.control}
            name="maxDiscount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحد الأقصى للخصم (اختياري)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  الحد الأقصى للخصم بالجنيه السوداني (اتركه فارغاً لعدم وجود حد)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ البداية *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ النهاية *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="usageLimitPerUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحد الأقصى لكل مستخدم</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>0 يعني غير محدود</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usageLimitGlobal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحد الأقصى الإجمالي (اختياري)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <FormDescription>اتركه فارغاً لعدم وجود حد</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معاينة الخصم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">مبلغ الطلب (مثال):</span>
                <span>1,000 ج.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الخصم:</span>
                <span className="text-green-600 font-semibold">
                  -{discountPreview.discountAmount.toFixed(2)} ج.س
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>المبلغ النهائي:</span>
                <span className="text-primary">
                  {discountPreview.finalAmount.toFixed(2)} ج.س
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>الكوبون نشط</FormLabel>
                <FormDescription>
                  الكوبونات غير النشطة لا يمكن استخدامها
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "جاري الحفظ..." : coupon ? "تحديث" : "إنشاء"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
