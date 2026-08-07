"use client";
import { useEffect, useState } from "react";
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
import { useAuth } from "@clerk/nextjs";
import { BannerTargetField } from "./BannerTargetField";
import { bannerTargetSchema, NONE_TARGET, toFormTarget } from "@/lib/bannerTarget";

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
  target: bannerTargetSchema,
});

export type BannerFormValues = z.infer<typeof bannerFormSchema>;

type BannerEdit = Partial<BannerFormValues> & { _id?: string };

interface BannerFormProps {
  banner?: BannerEdit;
  onClose: () => void;
  onSuccess?: () => void;
}

const defaults: BannerFormValues = {
  image: "",
  title: "",
  description: "",
  order: 0,
  isActive: true,
  target: NONE_TARGET,
};

/**
 * Merge a banner being edited over the defaults.
 *
 * `target` goes through `toFormTarget` rather than a plain spread because a
 * banner created before targets existed simply has no `target` key — and a
 * spread would leave the field `undefined`, which the resolver would reject
 * before the admin ever saw the form.
 */
const toFormValues = (banner?: BannerEdit): BannerFormValues => ({
  ...defaults,
  ...banner,
  target: toFormTarget(banner?.target),
});

export default function BannerForm({ banner, onClose, onSuccess }: BannerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!(banner && banner._id);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: toFormValues(banner),
    mode: "onChange",
  });
  const { getToken } = useAuth();
  useEffect(() => {
    form.reset(toFormValues(banner));
  }, [banner, form]);

  const onSubmit: SubmitHandler<BannerFormValues> = async (values) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const validatedData = bannerFormSchema.parse(values);
      const token = await getToken();
      if (isEditing) {
        await axiosInstance.put(`/banners/${banner._id}` , validatedData, {
        headers: {
      Authorization: `Bearer ${token}`,
    },
      } );
        toast.success("تم تحديث العرض بنجاح");
      } else {
        await axiosInstance.post(`/banners`, validatedData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("تم إضافة العرض بنجاح");
      }
      
      onSuccess?.();
      onClose();
      
      if (!isEditing) {
        form.reset(defaults);
      }
      
    } catch (error: any) {
      if (error instanceof Error && error.name === 'ZodError') {
        toast.error("يرجى التحقق من صحة البيانات المدخلة");
        return;
      }
      
      let errorMessage = "فشل في العملية";
      
      // Handle axios errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
        const message = axiosError.response?.data?.message;
        const errorMsg = axiosError.response?.data?.error;
        
        // Only use string messages, never render objects
        if (typeof message === 'string') {
          errorMessage = message;
        } else if (typeof errorMsg === 'string') {
          errorMessage = errorMsg;
        } else if (error?.response?.status === 404) {
          errorMessage = "المورد غير موجود";
        } else if (error?.response?.status === 401 || error?.response?.status === 403) {
          errorMessage = "غير مصرح لك بهذه العملية";
        } else if (error?.response?.status >= 500) {
          errorMessage = "خطأ في الخادم، يرجى المحاولة لاحقاً";
        }
      } else if (error instanceof Error) {
        errorMessage = typeof error.message === 'string' ? error.message : "فشل في العملية";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (form.formState.isDirty && !isSubmitting) {
      if (window.confirm("هل أنت متأكد من الإغلاق؟ سيتم فقدان التغييرات غير المحفوظة.")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

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
        <button 
          className="absolute top-4 left-4 hover:opacity-70 transition-opacity disabled:opacity-50"
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="إغلاق"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6 pr-6">
          {isEditing ? "تعديل عرض" : "إضافة عرض جديد"}
        </h2>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <BannerTargetField
            value={form.watch("target")}
            onChange={(target) =>
              form.setValue("target", target, { shouldValidate: true, shouldDirty: true })
            }
            // The union reports errors on the active branch's field (target.id /
            // target.url); fall back to the union-level message.
            error={
              (form.formState.errors.target as { message?: string } | undefined)?.message ??
              (form.formState.errors.target as { id?: { message?: string } } | undefined)?.id?.message ??
              (form.formState.errors.target as { url?: { message?: string } } | undefined)?.url?.message
            }
            disabled={isSubmitting}
          />

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
