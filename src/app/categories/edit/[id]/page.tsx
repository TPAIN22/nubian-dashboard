// src/app/categories/edit/[id]/page.tsx
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

const categoryFormSchema = z.object({
  name: z.string().min(1, "اسم الفئة مطلوب"),
  description: z.string().optional(),
  image: z.string().url("رابط الصورة غير صالح").optional().or(z.literal("")),
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
}

interface EditCategoryPageProps {
  params: { id: string };
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { id: categoryId } = params;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      parent: "",
    },
  });

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
        setCurrentCategory(categoryData);
        
        // فلترة الفئة الحالية من قائمة الآباء المحتملين
        const filteredCategories = allCategoriesRes.data.filter(
          (cat: Category) => cat._id !== categoryId && !cat.parent
        );
        setCategories(filteredCategories);

        // تحديد القيمة الصحيحة للفئة الرئيسية
        const parentValue = categoryData.parent?._id || "none";

        form.reset({
          name: categoryData.name,
          description: categoryData.description || "",
          image: categoryData.image || "",
          parent: parentValue,
        });
      } catch (error) {
        toast.error("فشل في جلب البيانات.");
        router.push("/categories");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, getToken, router, form]);

  // --- دالة الإرسال (Submit) للنموذج ---
  async function onSubmit(values: CategoryFormValues) {
    const dataToSend = {
      ...values,
      parent: values.parent === 'none' ? null : values.parent,
    };
    
    try {
      const token = await getToken();
      await axiosInstance.put(`/categories/${categoryId}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("تم تحديث الفئة بنجاح!");
      router.push("/categories");
      router.refresh();
    } catch (error: any) {
      toast.error(
        `فشل تحديث الفئة: ${error.response?.data?.message || error.message || "خطأ غير معروف"}`
      );
    }
  }

  if (loading) {
    return <div className="text-center mt-8">جاري تحميل بيانات الفئة...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 text-flt">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">تعديل الفئة</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* حقل اسم الفئة */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الفئة</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="أدخل اسم الفئة" />
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
                  <span style={{fontSize: '0.9em', color: '#888', display: 'block', marginBottom: 4}}>
                    إذا أردت إنشاء فئة رئيسية، اختر "بدون (فئة رئيسية)". إذا أردت إنشاء فئة فرعية، اختر الفئة الرئيسية المناسبة من القائمة.
                  </span>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر فئة رئيسية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <em>بدون (فئة رئيسية)</em>
                      </SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
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
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* زر الحفظ */}
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}