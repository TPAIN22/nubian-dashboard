'use client';

import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/multi-select";
import ImageUpload from "@/components/imageUpload";
import { axiosInstance } from "@/lib/axiosInstance";
import { useAuth } from "@clerk/nextjs";
import { Package, Store, FileText, DollarSign, Tag, Hash, Ruler } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,  
  SelectValue,
} from "@/components/ui/select";


// --- قاموس الترجمة لأسماء التصنيفات ---
const categoryNameTranslations: { [key: string]: string } = {
  'Sports & Outdoors': 'الرياضة والأنشطة الخارجية',
  'Beauty & Personal Care': 'الجمال والعناية الشخصية',
  'Fashion': 'الأزياء',
  'Books': 'الكتب',
  'Home & Kitchen': 'المنزل والمطبخ',
  'Electronics': 'الإلكترونيات',
  // أضف أي تصنيفات أخرى هنا إذا كانت لديك
};


const formSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  brand: z.string().min(1, "اسم المتجر مطلوب"),
  description: z.string().optional(),
  discountPrice: z.union([z.number().min(0, "السعر قبل الخصم يجب أن يكون رقما موجبا").optional(), z.literal(NaN).optional()]),
  price: z.number().min(0, "السعر يجب أن يكون رقما موجبا"),
  category: z.string().min(1, "التصنيف مطلوب"),
  stock: z.string().min(1, "الكمية المتوفرة مطلوبة"),
  sizes: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1, "الصورة مطلوبة").max(5, "الحد الأقصى 5 صور"),
});

interface Category {
  _id: string;
  name: string;
}

export default function ProductForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      brand: "",
      description: "",
      discountPrice: undefined,
      price: 0,
      category: "",
      stock: "",
      sizes: [],
      images: [],
    },
  });

  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication token not available.");
        }
        const res = await axiosInstance.get("/categories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategoriesError("فشل في تحميل التصنيفات. الرجاء المحاولة مرة أخرى.");
        toast.error("فشل في تحميل التصنيفات.");
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [getToken]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!values.images || values.images.length < 1) {
        toast.error("الرجاء رفع صورة واحدة على الأقل.");
        return;
      }
      if (values.images.length > 5) {
        toast.error("لا يمكن رفع أكثر من 5 صور.");
        return;
      }

      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const dataToSend = {
        ...values,
        discountPrice: isNaN(values.discountPrice as number) ? undefined : values.discountPrice,
        price: isNaN(values.price) ? 0 : values.price,
        category: values.category,
      };

      const res = await axiosInstance.post("/products", dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(res.data.message);

      toast("تم إنشاء المنتج بنجاح");
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
      console.error("Form submission error", errorMessage);
      toast.error(`فشل إرسال النموذج: ${errorMessage}`);
    }
  }

  const handleUploadDone = useCallback((urls: string[]) => {
    form.setValue("images", urls, { shouldValidate: true });
  }, [form]);

  const sizeOptions = [
    { label: "XS", value: "XS" },
    { label: "S", value: "S" },
    { label: "M", value: "M" },
    { label: "L", value: "L" },
    { label: "XL", value: "XL" },
    { label: "XXL", value: "XXL" },
    { label: "XXXL", value: "XXXL" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 text-flt">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg">
            <Package className="w-8 h-8 " />
          </div>
          <h1 className="text-3xl font-bold mb-2">إضافة منتج جديد</h1>
          <p className="text-gray-300">أضف منتجك الجديد إلى المتجر بسهولة</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <Card className="shadow-xl border backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  المعلومات الأساسية
                </CardTitle>
                <CardDescription className="">
                  أدخل المعلومات الأساسية للمنتج
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 ">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          اسم المنتج
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="شورت , قميص , لابتوب , شاحن ...."
                            type="text"
                            className="h-12 border-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=" font-medium flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          اسم المتجر
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ادخل اسم متجرك"
                            type="text"
                            className="h-12 border-2 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className=" font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        وصف المنتج
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="اوصف منتجك بالتفصيل..."
                          className="min-h-[120px] border-2 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="">
                        اكتب وصفاً مفصلاً يساعد العملاء على فهم المنتج
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="shadow-xl border backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  معلومات التسعير
                </CardTitle>
                <CardDescription className="">
                  حدد أسعار المنتج والتصنيف
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 ">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="discountPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=" font-medium">السعر قبل الخصم</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 " />
                            <Input
                              placeholder="السعر الأصلي"
                              type="number"
                              className="h-12 pl-10 border-2"
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? undefined : Number(value));
                              }}
                              value={field.value === undefined ? "" : field.value}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="">السعر النهائي *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                            <Input
                              placeholder="سعر البيع"
                              type="number"
                              className="h-12 pl-10 border-2 "
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? 0 : Number(value));
                              }}
                              value={field.value}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          التصنيف *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-2">
                              <SelectValue placeholder="اختر تصنيف المنتج" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesLoading ? (
                              <SelectItem value="loading-indicator" disabled>
                                جاري تحميل التصنيفات...
                              </SelectItem>
                            ) : categoriesError ? (
                              <SelectItem value="error-indicator" disabled className="text-red-500">
                                {categoriesError}
                              </SelectItem>
                            ) : categories.length === 0 ? (
                              <SelectItem value="no-categories-found" disabled>
                                لا توجد تصنيفات متاحة.
                              </SelectItem>
                            ) : (
                              categories.map((category) => (
                                <SelectItem
                                  key={category._id}
                                  value={category._id} // القيمة التي سترسل إلى الباك إند (الاسم الإنجليزي)
                                >
                                  {/* هنا يتم عرض الاسم العربي من القاموس، أو الاسم الإنجليزي كحل بديل */}
                                  {categoryNameTranslations[category.name] || category.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border">
              <CardHeader className="bg-gradient-to-r">
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  المخزون والمقاسات
                </CardTitle>
                <CardDescription className="">
                  حدد الكمية المتوفرة والمقاسات
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=" font-medium flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          الكمية المتوفرة *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="عدد القطع المتوفرة"
                            type="text"
                            className="h-12 border-2 "
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sizes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=" flex items-center gap-2">
                          <Ruler className="w-4 h-4" />
                          المقاسات المتوفرة
                        </FormLabel>
                        <FormControl>
                          <MultiSelector
                            values={field.value || []}
                            onValuesChange={field.onChange}
                            loop
                            className="w-full"
                          >
                            <MultiSelectorTrigger className="h-12 border-2 ">
                              <MultiSelectorInput placeholder="اختر المقاسات المتوفرة" />
                            </MultiSelectorTrigger>
                            <MultiSelectorContent>
                              <MultiSelectorList>
                                {sizeOptions.map((option) => (
                                  <MultiSelectorItem key={option.value} value={option.value}>
                                    {option.label}
                                  </MultiSelectorItem>
                                ))}
                              </MultiSelectorList>
                            </MultiSelectorContent>
                          </MultiSelector>
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border">
              <CardHeader className="bg-gradient-to-r rounded-t-lg">
                <CardTitle>صور المنتج</CardTitle>
                <CardDescription className="text-orange-300">
                  ارفع صور واضحة للمنتج
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 ">
                <div className="">
                  <ImageUpload onUploadComplete={handleUploadDone} />
                </div>
                <p className="text-sm mt-3 text-center">
                  يفضل رفع 3-5 صور بجودة عالية لعرض أفضل للمنتج
                </p>
                <FormMessage>{form.formState.errors.images?.message}</FormMessage>
              </CardContent>
            </Card>

            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                size="lg"
                className="cursor-pointer hover:bg-[#c2c0c0]"
                disabled={form.formState.isSubmitting || categoriesLoading}
              >
                <Package className="w-5 h-5 mr-2" />
                {form.formState.isSubmitting ? "جاري الرفع..." : "ارفع إلى المتجر"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}