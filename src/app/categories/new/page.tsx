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
import { SimpleImageUpload } from "@/components/simpleImageUpload"; // استخدام المسار الصحيح والمكون الصحيح

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
  parent?: string;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get("/categories");
        // فلترة الفئات التي يمكن أن تكون آباء (فقط الفئات الرئيسية)
        const parentCategories = res.data.filter((cat: Category) => !cat.parent);
        setCategories(parentCategories);
      } catch (error) {
        toast.error("فشل في جلب قائمة الفئات." , {
          description: error instanceof Error ? error.message : "خطأ غير معروف",
        });
      }
    };
    fetchCategories();
  }, []);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      parent: "",
    },
  });

  async function onSubmit(values: CategoryFormValues) {
    const dataToSend = {
      ...values,
      parent: values.parent === 'none' ? null : values.parent,
    };
    
    try {
      const token = await getToken();
      await axiosInstance.post(`/categories`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("تم إنشاء الفئة بنجاح!");
      router.push("/categories");
      router.refresh();
    } catch (error) {
      toast.error("فشل إنشاء الفئة" , {
        description: error instanceof Error ? error.message : "خطأ غير معروف",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 text-flt">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">إضافة فئة جديدة</h1>

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
                    <Textarea {...field} placeholder="أدخل وصفًا موجزًا للفئة" />
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
                    إذا أردت إنشاء فئة رئيسية، اختر &quot;بدون (فئة رئيسية)&quot;. إذا أردت إنشاء فئة فرعية، اختر الفئة الرئيسية المناسبة من القائمة.
                  </span>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      value={field.value || ""}
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
              {form.formState.isSubmitting ? "جاري الإنشاء..." : "إنشاء الفئة"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
} 