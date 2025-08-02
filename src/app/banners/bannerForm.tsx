"use client";
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SimpleImageUpload } from "@/components/simpleImageUpload";
import { X, Loader2 } from "lucide-react";

// تحسين schema للتحقق من صحة البيانات
const bannerFormSchema = z.object({
  image: z.string()
    .min(1, "الصورة مطلوبة")
    .refine((val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, "رابط الصورة غير صالح"),
  title: z.string().trim(),
  description: z.string().trim(),
  order: z.coerce.number().min(0, "الترتيب يجب أن يكون رقم موجب"),
  isActive: z.boolean(),
});

export type BannerFormValues = z.infer<typeof bannerFormSchema>;

type BannerEdit = Partial<BannerFormValues> & { _id?: string };

interface BannerFormProps {
  banner?: BannerEdit;
  onClose: () => void;
  onSuccess?: () => void; // callback عند النجاح
}

const defaults: BannerFormValues = {
  image: "",
  title: "",
  description: "",
  order: 0,
  isActive: true,
};

export default function BannerForm({ banner, onClose, onSuccess }: BannerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!(banner && banner._id);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: banner ? { ...defaults, ...banner } : defaults,
    mode: "onChange", // التحقق عند كل تغيير
  });

  // إعادة تعيين النموذج عند تغيير البانر
  useEffect(() => {
    if (banner) {
      form.reset({ ...defaults, ...banner });
    } else {
      form.reset(defaults);
    }
  }, [banner, form]);

  const onSubmit: SubmitHandler<BannerFormValues> = async (values) => {
    if (isSubmitting) return; // منع الإرسال المتكرر

    setIsSubmitting(true);
    
    try {
      // التحقق من صحة البيانات مرة أخرى
      const validatedData = bannerFormSchema.parse(values);
      
      if (isEditing) {
        await axiosInstance.put(`/banners/${banner._id}`, validatedData);
        toast.success("تم تحديث العرض بنجاح");
      } else {
        await axiosInstance.post(`/banners`, validatedData);
        toast.success("تم إضافة العرض بنجاح");
      }
      
      // استدعاء callback النجاح
      onSuccess?.();
      
      // إغلاق النموذج
      onClose();
      
      // إعادة تعيين النموذج إذا لم يتم الإغلاق
      if (!isEditing) {
        form.reset(defaults);
      }
      
    } catch (error: any) {
      console.error("Banner form error:", error);
      
      // معالجة أخطاء التحقق من صحة البيانات
      if (error.name === 'ZodError') {
        toast.error("يرجى التحقق من صحة البيانات المدخلة");
        return;
      }
      
      // معالجة أخطاء الخادم
      let errorMessage = "فشل في العملية";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // دالة لإغلاق النموذج مع التأكيد في حالة وجود تغييرات
  const handleClose = () => {
    if (form.formState.isDirty && !isSubmitting) {
      if (window.confirm("هل أنت متأكد من الإغلاق؟ سيتم فقدان التغييرات غير المحفوظة.")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // منع إغلاق النموذج بالضغط على الخلفية أثناء الإرسال
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose();
    }
  };

  return (
         <div 
       className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4"
       onClick={handleBackdropClick}
     >
       <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
         {/* زر الإغلاق */}
         <button 
           className="absolute top-4 left-4 hover:opacity-70 transition-opacity disabled:opacity-50"
           onClick={handleClose}
           disabled={isSubmitting}
           aria-label="إغلاق"
         >
           <X size={20} />
         </button>

         {/* العنوان */}
         <h2 className="text-xl font-bold mb-6 pr-6">
           {isEditing ? "تعديل عرض" : "إضافة عرض جديد"}
         </h2>

        {/* النموذج */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     {/* حقل صورة العرض */}
           <div>
             <label className="block mb-2 font-medium">
               صورة العرض *
             </label>
             <SimpleImageUpload 
               value={form.watch("image") || ""} 
               onChange={(val) => {
                 form.setValue("image", val || "", { shouldValidate: true });
               }}
             />
             {form.formState.errors.image && (
               <div className="text-destructive text-sm mt-1">
                 {form.formState.errors.image.message}
               </div>
             )}
           </div>

           {/* حقل العنوان */}
           <div>
             <label className="block mb-2 font-medium">
               العنوان
             </label>
            <Input 
              {...form.register("title")} 
              placeholder="عنوان اختياري للعرض" 
              disabled={isSubmitting}
              className="w-full"
            />
                         {form.formState.errors.title && (
               <div className="text-destructive text-sm mt-1">
                 {form.formState.errors.title.message}
               </div>
             )}
           </div>

           {/* حقل الوصف */}
           <div>
             <label className="block mb-2 font-medium">
               الوصف
             </label>
             <Textarea 
               {...form.register("description")} 
               placeholder="وصف اختياري للعرض"
               disabled={isSubmitting}
               className="w-full"
               rows={3}
             />
             {form.formState.errors.description && (
               <div className="text-destructive text-sm mt-1">
                 {form.formState.errors.description.message}
               </div>
             )}
           </div>

           {/* حقل الترتيب */}
           <div>
             <label className="block mb-2 font-medium">
               الترتيب
             </label>
            <Input 
              type="number" 
              {...form.register("order", { valueAsNumber: true })} 
              min={0}
              placeholder="0"
              disabled={isSubmitting}
              className="w-full"
            />
                         <div className="text-xs text-muted-foreground mt-1">
               رقم أقل = ظهور أولاً في القائمة
             </div>
             {form.formState.errors.order && (
               <div className="text-destructive text-sm mt-1">
                 {form.formState.errors.order.message}
               </div>
             )}
           </div>

           {/* حقل الحالة */}
           <div className="flex items-center gap-3">
             <input 
               type="checkbox" 
               id="isActive" 
               {...form.register("isActive")} 
               className="w-4 h-4"
               disabled={isSubmitting}
             />
             <label htmlFor="isActive" className="font-medium cursor-pointer">
               العرض مفعل
             </label>
           </div>

          {/* أزرار التحكم */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  {isEditing ? "جاري التحديث..." : "جاري الإضافة..."}
                </>
              ) : (
                isEditing ? "تحديث العرض" : "إضافة العرض"
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>

                 {/* معلومات إضافية */}
         {isSubmitting && (
           <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
             <div className="text-center">
               <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
               <p className="text-sm text-muted-foreground">
                 {isEditing ? "جاري تحديث العرض..." : "جاري إضافة العرض..."}
               </p>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}