"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

import { axiosInstance } from "@/lib/axiosInstance";
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
  parent?: string;
}

export default function MerchantNewCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  const fromParam = searchParams.get("from");
  const backHref = fromParam || "/merchant/products/new";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get("/categories");
        const parentCategories = res.data.filter((cat: Category) => !cat.parent);
        setCategories(parentCategories);
      } catch (error) {
        toast.error("فشل في جلب قائمة الفئات.", {
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
      parent: values.parent === "none" || values.parent === "" ? null : values.parent,
    };

    try {
      const token = await getToken();
      await axiosInstance.post(`/categories`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("تم إنشاء الفئة بنجاح!");
      router.push(backHref);
      router.refresh();
    } catch (error) {
      toast.error("فشل إنشاء الفئة", {
        description: error instanceof Error ? error.message : "خطأ غير معروف",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 text-flt">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">إضافة فئة جديدة</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href={backHref}>
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          إذا لم تجد التصنيف المناسب لمنتجك، يمكنك إضافة فئة جديدة هنا. ستكون الفئة متاحة لجميع التجار فور إنشائها.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

            <FormField
              control={form.control}
              name="parent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الفئة الرئيسية (اختياري)</FormLabel>
                  <span style={{ fontSize: "0.9em", color: "#888", display: "block", marginBottom: 4 }}>
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

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صورة الفئة</FormLabel>
                  <FormControl>
                    <SimpleImageUpload value={field.value || ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "جاري الإنشاء..." : "إنشاء الفئة"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
