import { z } from "zod";

// Phone number regex pattern for basic international / Sudan validation
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
// IBAN Basic check (e.g. starts with 2 chars, then numbers)
const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;

export const merchantRegistrationSchema = z.object({
  storeName: z.string().min(3, "يجب أن يكون اسم المتجر 3 أحرف على الأقل").max(50, "اسم المتجر طويل جداً"),
  ownerName: z.string().min(2, "يجب أن يكون اسم المالك حرفين على الأقل"),
  phone: z.string().regex(phoneRegex, "صيغة رقم الهاتف غير صحيحة"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  
  merchantType: z.enum(["individual", "business"]),
  nationalId: z.string().min(5, "يجب أن يتكون رقم الهوية من 5 أرقام على الأقل"),
  crNumber: z.string().optional(),
  
  iban: z.string().regex(ibanRegex, "صيغة الآيبان غير صحيحة (مثال: SD12...)").min(12, "رقم الآيبان قصير جداً"),
  
  logoUrl: z.string().min(1, "يرجى رفع شعار المتجر"),
  description: z.string().min(35, "يرجى تقديم وصف أدق للمتجر (350 حرفاً كحد أدنى)"),
  categories: z.array(z.string()).min(1, "يرجى اختيار فئة واحدة على الأقل"),
  city: z.string().min(1, "يرجى اختيار مدينتك"),
  productSamples: z.array(z.string()).min(3, "يرجى رفع 3 صور على الأقل لمنتجاتك"),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "يجب الموافقة على شروط الخدمة وسياسة الخصوصية",
  }),
}).superRefine((data, ctx) => {
  if (data.merchantType === 'business' && (!data.crNumber || data.crNumber.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "السجل التجاري (CR) مطلوب للشركات والمؤسسات",
      path: ["crNumber"]
    });
  }
});

export type MerchantRegistrationData = z.infer<typeof merchantRegistrationSchema>;
