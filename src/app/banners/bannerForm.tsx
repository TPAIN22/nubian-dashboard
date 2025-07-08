"use client";
import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SimpleImageUpload } from "@/components/simpleImageUpload";

const bannerFormSchema = z.object({
  image: z.string().min(1, "الصورة مطلوبة").url("رابط الصورة غير صالح").default(""),
  title: z.string().default(""),
  description: z.string().default(""),
  order: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
}).strict();

export type BannerFormValues = z.infer<typeof bannerFormSchema>;

type BannerEdit = Partial<BannerFormValues> & { _id?: string };

const defaults: BannerFormValues = {
  image: "",
  title: "",
  description: "",
  order: 0,
  isActive: true,
};

export default function BannerForm({ banner, onClose }: { banner?: BannerEdit; onClose: () => void }) {
  // NOTE: Temporary any to bypass zodResolver/useForm type mismatch
  const form = useForm<any>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: banner ? { ...defaults, ...banner } : defaults,
  });

  const onSubmit: SubmitHandler<BannerFormValues> = async (values) => {
    try {
      if (banner && banner._id) {
        await axiosInstance.put(`/banners/${banner._id}`, values);
        toast.success("تم تحديث العرض بنجاح");
      } else {
        await axiosInstance.post(`/banners`, values);
        toast.success("تم إضافة العرض بنجاح");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "فشل العملية");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 left-2 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">{banner && banner._id ? "تعديل عرض" : "إضافة عرض جديد"}</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">صورة العرض</label>
            <SimpleImageUpload value={form.watch("image")} onChange={val => form.setValue("image", val || "")} />
            {typeof form.formState.errors.image?.message === "string" && (
              <div className="text-red-500 text-sm mt-1">{form.formState.errors.image.message}</div>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">العنوان</label>
            <Input {...form.register("title")} placeholder="عنوان اختياري" />
          </div>
          <div>
            <label className="block mb-1 font-medium">الوصف</label>
            <Textarea {...form.register("description")} placeholder="وصف اختياري" />
          </div>
          <div>
            <label className="block mb-1 font-medium">الترتيب</label>
            <Input type="number" {...form.register("order", { valueAsNumber: true })} min={0} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...form.register("isActive")} className="accent-orange-500" />
            <label htmlFor="isActive">مفعل</label>
          </div>
          <Button type="submit" className="w-full mt-2">{banner && banner._id ? "تحديث" : "إضافة"}</Button>
        </form>
      </div>
    </div>
  );
} 