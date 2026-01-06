"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

// استيراد مكونات واجهة المستخدم (UI Components)
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// استيراد instance الخاص بـ Axios
import { axiosInstance } from "@/lib/axiosInstance";
// استيراد المكون المبسط لرفع الصور
import { SimpleImageUpload } from "@/components/simpleImageUpload";

// تحسين schema للتحقق من صحة البيانات
const categoryFormSchema = z.object({
  name: z.string().min(1, "اسم الفئة مطلوب").trim(),
  description: z.string().optional(),
  image: z.string()
    .refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
      message: "رابط الصورة غير صالح"
    })
    .optional(),
  parent: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface Category {
  _id: string;
  name: string;
  parent?: {
    _id: string;
    name: string;
  } | null;
  children?: string[]; // إضافة معلومات الفئات الفرعية
}

// Client component to handle the actual form logic
export default function EditCategoryClient({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      parent: "none",
    },
  });

  // دالة للحصول على جميع الفئات الفرعية للفئة المحددة
  const getAllChildrenIds = (categoryId: string, allCategories: Category[]): string[] => {
    const children: string[] = [];
    const findChildren = (parentId: string) => {
      allCategories.forEach(cat => {
        if (cat.parent?._id === parentId) {
          children.push(cat._id);
          findChildren(cat._id); // البحث عن الفئات الفرعية للفئات الفرعية
        }
      });
    };
    findChildren(categoryId);
    return children;
  };

  // --- جلب بيانات الفئة والفئات الأخرى ---
  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return;
      setLoading(true);
      try {
        const token = await getToken();
        // جلب الفئات بالتوازي
        const [categoryRes, allCategoriesRes] = await Promise.all([
          axiosInstance.get(`/categories/${categoryId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axiosInstance.get("/categories"),
        ]);

        const categoryData = categoryRes.data;
        const allCategories = allCategoriesRes.data;
        
        setCurrentCategory(categoryData);
        
        // فلترة الفئات: استبعاد الفئة الحالية وجميع فئاتها الفرعية
        const childrenIds = getAllChildrenIds(categoryId, allCategories);
        const excludedIds = [categoryId, ...childrenIds];
        
        const filteredCategories = allCategories.filter(
          (cat: Category) => !excludedIds.includes(cat._id) && !cat.parent // عرض الفئات الرئيسية فقط
        );
        
        setCategories(filteredCategories);

        // تحديد القيمة الصحيحة للفئة الرئيسية
        const parentValue = categoryData.parent?._id || "none";

        form.reset({
          name: categoryData.name || "",
          description: categoryData.description || "",
          image: categoryData.image || "",
          parent: parentValue,
        });
      } catch (error: unknown) {
        console.error("Error fetching data:", error);
        toast.error("فشل في جلب البيانات.");
        router.push("/business/categories");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, getToken, router, form]);

  // --- دالة الإرسال (Submit) للنموذج ---
  async function onSubmit(values: CategoryFormValues) {
    try {
      // التحقق من صحة البيانات قبل الإرسال
      if (!values.name?.trim()) {
        toast.error("اسم الفئة مطلوب");
        return;
      }

      const dataToSend = {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        image: values.image?.trim() || "",
        parent: values.parent === 'none' || !values.parent ? null : values.parent,
      };
      
      const token = await getToken();
      
      if (!token) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      await axiosInstance.put(`/categories/${categoryId}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("تم تحديث الفئة بنجاح!");
      router.push("/business/categories");
      router.refresh();
    } catch (error: unknown) {
      console.error("Update error:", error);
      const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
      toast.error(`فشل تحديث الفئة: ${errorMessage}`);
    }
  }

  // دالة للعودة إلى قائمة الفئات
  const handleCancel = () => {
    router.push("/business/categories");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-4 text-flt flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل بيانات الفئة...</p>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-4 text-flt flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">لم يتم العثور على الفئة</p>
          <Button onClick={handleCancel}>العودة إلى قائمة الفئات</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 text-flt">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">تعديل الفئة: {currentCategory.name}</h1>
          <Button variant="outline" onClick={handleCancel}>
            إلغاء
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* حقل اسم الفئة */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الفئة *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="أدخل اسم الفئة" 
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* حقل وصف الفئة */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف الفئة</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="أدخل وصفًا موجزًا للفئة"
                      disabled={form.formState.isSubmitting}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* حقل الفئة الرئيسية */}
            <FormField
              control={form.control}
              name="parent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الفئة الرئيسية (اختياري)</FormLabel>
                  <div className="text-sm text-muted-foreground mb-2">
                    إذا أردت إنشاء فئة رئيسية، اختر &quot;بدون (فئة رئيسية)&quot;. إذا أردت إنشاء فئة فرعية، اختر الفئة الرئيسية المناسبة من القائمة.
                  </div>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || "none"}
                    disabled={form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر فئة رئيسية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <em>بدون (فئة رئيسية)</em>
                      </SelectItem>
                      {categories.length === 0 ? (
                        <SelectItem value="no-categories" disabled>
                          لا توجد فئات رئيسية متاحة
                        </SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* حقل صورة الفئة باستخدام SimpleImageUpload */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صورة الفئة</FormLabel>
                  <FormControl>
                    <SimpleImageUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={form.formState.isSubmitting}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
