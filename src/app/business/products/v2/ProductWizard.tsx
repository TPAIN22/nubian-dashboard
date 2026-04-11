"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useForm, useFieldArray, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ChevronRight,
    ChevronLeft,
    Save,
    Loader2,
    Plus,
    Trash2,
    Image as ImageIcon,
    Settings,
    LayoutGrid,
    CheckCircle2,
    AlertCircle,
    CopyPlus
} from "lucide-react";

import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
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
import { Switch } from "@/components/ui/switch";

import {
    FileUploader,
    FileInput,
    FileUploaderContent,
    FileUploaderItem
} from "@/components/ui/file-uploader";

// ==========================================
// ZOD SCHEMAS
// ==========================================

const variantSchema = z.object({
    sku: z.string().min(1, "SKU مطلوب"),
    attributes: z.record(z.string()),
    merchantPrice: z.number().min(0, "السعر لا يمكن أن يكون سالباً"),
    stock: z.number().min(0, "المخزون لا يمكن أن يكون سالباً"),
    isActive: z.boolean(),
    images: z.array(z.string()).optional(),
});

const attributeSchema = z.object({
    name: z.string().min(1, "اسم الخاصية مطلوب"),
    options: z.array(z.string()).min(1, "يجب إضافة قيمة واحدة على الأقل"),
});

const productSchema = z.object({
    name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
    description: z.string().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
    category: z.string().min(1, "الفئة مطلوبة"),
    isActive: z.boolean(),
    images: z.array(z.string()).min(1, "يجب رفع صورة واحدة على الأقل"),
    productType: z.enum(["simple", "with_variants"]),

    // Simple product fields
    merchantPrice: z.number().min(0).optional(),
    stock: z.number().min(0).optional(),

    // Complex product fields
    attributes: z.array(attributeSchema),
    variants: z.array(variantSchema),

    // UI Helpers (Transient)
    colorImages: z.record(z.array(z.string())),
    colorPrices: z.record(z.number()),
});

type ProductFormData = z.infer<typeof productSchema>;

// ==========================================
// WIZARD COMPONENT
// ==========================================

interface Props {
    productId?: string;
    redirectPath?: string;
}

export default function ProductWizard({ productId, redirectPath = "/business/products" }: Props) {
    const router = useRouter();
    const { getToken } = useAuth();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(1);

    // Form Initialization
    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            description: "",
            category: "",
            isActive: true,
            images: [],
            productType: "simple",
            merchantPrice: 1,
            stock: 1,
            attributes: [],
            variants: [],
            colorImages: {},
            colorPrices: {},
        },
    });

    const { control, handleSubmit, watch, setValue, reset, formState: { isValid, isSubmitting, errors } } = form;
    const productType = watch("productType");
    const variants = watch("variants") || [];
    const attributes = watch("attributes") || [];

    // Fetch Categories
    const { data: categories = [], isLoading: loadingCats } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const token = await getToken();
            const res = await axiosInstance.get("/categories", {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data || [];
        }
    });

    // Fetch Product (Edit Mode)
    const { data: existingProduct, isLoading: loadingProduct } = useQuery({
        queryKey: ["product", productId],
        queryFn: async () => {
            if (!productId) return null;
            const token = await getToken();
            const res = await axiosInstance.get(`/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const p = res.data.data || res.data;

            // Map backend product to form data
            const isVar = p.variants && p.variants.length > 0;
            const mapped: ProductFormData = {
                name: p.name,
                description: p.description,
                category: p.category?._id || p.category,
                isActive: p.isActive ?? true,
                images: p.images || [],
                productType: isVar ? "with_variants" : "simple",
                merchantPrice: p.merchantPrice || p.price || 0,
                stock: p.stock || 0,
                attributes: p.attributes || [],
                variants: p.variants || [],
                colorImages: {},
                colorPrices: {},
            };

            // Reconstruct color maps
            const colorAttr = p.attributes?.find((a: any) => a.name.toLowerCase() === 'color' || a.name === 'اللون');
            if (colorAttr && p.variants) {
                p.variants.forEach((v: any) => {
                    const color = v.attributes[colorAttr.name];
                    if (color) {
                        if (v.images?.length > 0) {
                            if (!mapped.colorImages) mapped.colorImages = {};
                            mapped.colorImages[color] = v.images;
                        }
                        if (v.merchantPrice) {
                            if (!mapped.colorPrices) mapped.colorPrices = {};
                            mapped.colorPrices[color] = v.merchantPrice;
                        }
                    }
                });
            }

            reset(mapped);
            return p;
        },
        enabled: !!productId,
    });

    // Save Mutation
    const mutation = useMutation({
        mutationFn: async (data: ProductFormData) => {
            const token = await getToken();
            const payload = buildPayload(data);

            if (productId) {
                return axiosInstance.put(`/products/${productId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                return axiosInstance.post(`/products`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        },
        onSuccess: () => {
            toast.success(productId ? "تم التحديث بنجاح" : "تمت الإضافة بنجاح");
            queryClient.invalidateQueries({ queryKey: ["products"] });
            router.push(redirectPath);
        },
        onError: (err: any) => {
            toast.error("خطأ: " + (err.response?.data?.message || err.message));
        }
    });

    // Helper: Build Payload for API
    const buildPayload = (data: ProductFormData) => {
        const payload: any = {
            ...(existingProduct || {}),
            name: data.name,
            description: data.description,
            category: data.category,
            isActive: data.isActive,
            status: data.isActive ? "active" : "draft",
            images: data.images,
        };

        if (data.productType === "simple") {
            // Backend requires a variant-first approach
            payload.variants = [{
                sku: `${data.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                merchantPrice: data.merchantPrice || 0,
                stock: data.stock || 0,
                isActive: true,
                images: data.images,
                attributes: { size: "os", color: "default" }
            }];
        } else {
            const colorAttr = data.attributes.find(a => a.name.toLowerCase() === 'color' || a.name === 'اللون');
            payload.variants = data.variants.map((v: any) => {
                const colorVal = colorAttr ? v.attributes[colorAttr.name] || "default" : "default";
                const fallbackImages = (data.colorImages && data.colorImages[colorVal]) || data.images;
                const fallbackPrice = (data.colorPrices && data.colorPrices[colorVal]) || 0;

                return {
                    ...v,
                    merchantPrice: Number(v.merchantPrice || fallbackPrice),
                    stock: Number(v.stock || 0),
                    images: v.images?.length ? v.images : fallbackImages,
                    attributes: {
                        color: colorVal,
                        size: v.attributes?.["المقاس"] || v.attributes?.size || "os",
                        ...v.attributes
                    }
                };
            });
        }
        return payload;
    };

    // Helper: Generate Variants from Attributes
    const generateVariants = () => {
        if (attributes.length === 0) return;

        // Correct cartesian implementation that returns string[][]
        const cartesian = (args: string[][]): string[][] =>
            args.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]] as string[][]);

        const options = attributes.map(a => a.options);
        const combinations = cartesian(options);

        const productName = watch("name");
        const defaultPrice = watch("merchantPrice") || 0;

        const newVariants = combinations.map((combo) => {
            const variantAttrs: Record<string, string> = {};
            attributes.forEach((attr, i) => { variantAttrs[attr.name] = combo[i]; });

            const sku = `SKU-${productName.slice(0, 3).toUpperCase()}-${combo.join("-").toUpperCase()}`;
            return {
                sku,
                attributes: variantAttrs,
                merchantPrice: defaultPrice,
                stock: 0,
                isActive: true,
                images: [],
            };
        });

        setValue("variants", newVariants);
        toast.info(`تم إنشاء ${newVariants.length} متغير`);
    };

    // Helper: Handle Image Uploads
    const handleImageUpload = async (files: (File | string)[], onChange: (val: string[]) => void) => {
        const newUrls: string[] = [];
        const filesToUpload: File[] = [];

        files.forEach(f => {
            if (typeof f === "string") newUrls.push(f);
            else filesToUpload.push(f);
        });

        if (filesToUpload.length > 0) {
            const toastId = toast.loading("جاري رفع الصور...");
            try {
                const uploaded = await Promise.all(
                    filesToUpload.map(file => import("@/lib/upload").then(m => m.uploadImageToImageKit(file)))
                );
                onChange([...newUrls, ...uploaded]);
                toast.success("تم رفع الصور بنجاح", { id: toastId });
            } catch (err) {
                toast.error("فشل رفع بعض الصور", { id: toastId });
                onChange(newUrls);
            }
        } else {
            onChange(newUrls);
        }
    };

    const nextStep = async () => {
        const stepFields: Record<number, (keyof ProductFormData)[]> = {
            1: ["name", "description", "category", "images", "productType"],
            2: ["attributes", "merchantPrice", "stock"],
            3: ["variants"],
            4: ["colorImages"],
            5: ["colorPrices"],
        };

        const isStepValid = await form.trigger(stepFields[currentStep]);
        if (!isStepValid) {
            toast.warning("يرجى ملء كافة الحقول المطلوبة بشكل صحيح");
            return;
        }

        if (productType === "simple" && currentStep === 1) {
            setCurrentStep(6);
            return;
        }

        setCurrentStep(prev => Math.min(prev + 1, 6));
    };

    const prevStep = () => {
        if (productType === "simple" && currentStep === 6) {
            setCurrentStep(1);
            return;
        }
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    if (loadingProduct || loadingCats) {
        return <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">جاري التحميل...</p>
        </div>;
    }

    const steps = [
        { title: "البيانات الأساسية", icon: <ImageIcon className="w-4 h-4" /> },
        { title: "الخيارات والسمات", icon: <Settings className="w-4 h-4" /> },
        { title: "المخزون والكميات", icon: <LayoutGrid className="w-4 h-4" /> },
        { title: "صور الألوان", icon: <ImageIcon className="w-4 h-4" /> },
        { title: "التسعير", icon: <Save className="w-4 h-4" /> },
        { title: "المراجعة", icon: <CheckCircle2 className="w-4 h-4" /> },
    ];

    return (
        <Form {...form}>
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{productId ? "تعديل منتج" : "إضافة منتج جديد"}</h1>
                        <p className="text-muted-foreground mt-1">قم بتعبئة تفاصيل المنتج لإنشائه في المتجر</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Badge variant={mutation.isError ? "destructive" : "outline"} className="px-3 py-1">
                            {mutation.isPending ? "جاري الحفظ..." : mutation.isError ? "فشل الحفظ" : "جاهز"}
                        </Badge>
                    </div>
                </div>

                {/* Stepper Navigation */}
                <Card className="border-none shadow-sm bg-muted/30">
                    <CardContent className="p-4 overflow-x-auto">
                        <div className="flex items-center justify-between min-w-[700px]">
                            {steps.map((step, idx) => {
                                const stepNum = idx + 1;
                                const isActive = currentStep === stepNum;
                                const isCompleted = currentStep > stepNum;
                                if (productType === "simple" && stepNum > 1 && stepNum < 6) return null;

                                return (
                                    <div key={idx} className="flex items-center flex-1 last:flex-none">
                                        <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-70'}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors 
                                                ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' :
                                                    isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-background border-muted'}`}>
                                                {isCompleted ? "✓" : stepNum}
                                            </div>
                                            <span className={`text-[10px] md:text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                                                {step.title}
                                            </span>
                                        </div>
                                        {idx < steps.length - 1 && !(productType === "simple" && stepNum === 1) && (
                                            <div className={`h-[2px] flex-1 mx-4 transition-colors duration-500 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Step Content Area */}
                <main className="min-h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-12">
                            {currentStep === 1 && <BasicInfoStep categories={categories} onUpload={handleImageUpload} />}
                            {currentStep === 2 && productType === "with_variants" && <VariantSetupStep generate={generateVariants} />}
                            {currentStep === 3 && productType === "with_variants" && <VariantMatrixStep />}
                            {currentStep === 4 && productType === "with_variants" && <VariantImagesStep onUpload={handleImageUpload} />}
                            {currentStep === 5 && productType === "with_variants" && <PricingStep />}
                            {currentStep === 6 && <ReviewStep />}
                        </div>
                    </div>
                </main>

                {/* Footer Controls */}
                <footer className="flex items-center justify-between border-t pt-6">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={prevStep}
                        disabled={currentStep === 1 || mutation.isPending}
                        className="gap-2"
                    >
                        <ChevronRight className="w-4 h-4" /> السابق
                    </Button>

                    <div className="flex gap-3">
                        {currentStep < 6 ? (
                            <Button size="lg" onClick={nextStep} className="gap-2 min-w-[140px]">
                                التالي <ChevronLeft className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                onClick={handleSubmit((d) => mutation.mutate(d as any))}
                                disabled={mutation.isPending}
                                className="gap-2 min-w-[160px] bg-green-600 hover:bg-green-700 text-white transition-all hover:shadow-xl"
                            >
                                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                إتمام وحفظ المنتج
                            </Button>
                        )}
                    </div>
                </footer>
            </div>
        </Form>
    );
}

// ==========================================
// SUB-COMPONENTS (STEPS)
// ==========================================

function BasicInfoStep({ categories, onUpload }: { categories: any[]; onUpload: any }) {
    const { control, watch } = useFormContext<ProductFormData>();
    const productType = watch("productType");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-4">
            <Card className="lg:col-span-2 border-primary/10 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">معلومات المنتج</CardTitle>
                    <CardDescription>أدخل البيانات الأساسية التي ستظهر للعملاء</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold">اسم المنتج</FormLabel>
                                <FormControl><Input placeholder="مثل: حذاء رياضي نايك" className="h-11" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold">الوصف</FormLabel>
                                <FormControl><Textarea rows={4} placeholder="اكتب وصفاً جذاباً لمنتجك..." className="resize-none" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">التصنيف</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11"><SelectValue placeholder="اختر تصنيفاً" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="productType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">نوع المنتج</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 font-medium bg-primary/5 border-primary/20"><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="simple">منتج بسيط (بدون خيارات)</SelectItem>
                                            <SelectItem value="with_variants">منتج متعدد (ألوان/مقاسات)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {productType === "simple" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dashed animate-in fade-in slide-in-from-top-3">
                            <FormField
                                control={control}
                                name="merchantPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-primary">السعر الأساسي (ريال)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="h-11 pl-12 border-primary/30 focus-visible:ring-primary shadow-sm"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold opacity-40">SAR</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="stock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-primary">الكمية المتوفرة</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                className="h-11 border-primary/30 focus-visible:ring-primary shadow-sm"
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="text-xl">صور المنتج</CardTitle>
                    <CardDescription>ارفع الصور الرئيسية للمنتج</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={control}
                        name="images"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <FileUploader
                                        value={field.value}
                                        onValueChange={(files) => onUpload(files, field.onChange)}
                                        dropzoneOptions={{
                                            maxFiles: 6,
                                            maxSize: 2 * 1024 * 1024,
                                        }}
                                    >
                                        <FileInput className="border-2 border-dashed border-muted-foreground/20 h-32 flex items-center justify-center hover:bg-muted/50 transition-colors">
                                            <div className="flex flex-col items-center gap-1">
                                                <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                                                <p className="text-xs text-muted-foreground">صيغ: JPG, PNG (بحد أقصى 2MB)</p>
                                            </div>
                                        </FileInput>
                                        <FileUploaderContent className="flex flex-row flex-wrap gap-2 pt-2">
                                            {field.value.map((url: string, i: number) => (
                                                <FileUploaderItem key={i} index={i} className="w-20 h-20 p-0 border rounded-lg overflow-hidden group relative">
                                                    <img src={url} className="w-full h-full object-cover" />
                                                </FileUploaderItem>
                                            ))}
                                        </FileUploaderContent>
                                    </FileUploader>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function VariantSetupStep({ generate }: { generate: () => void }) {
    const { control, watch } = useFormContext<ProductFormData>();
    const { fields, append, remove } = useFieldArray({ control, name: "attributes" });

    const PRESET_ATTRIBUTES = [
        { label: "اللون (Color)", value: "اللون" },
        { label: "المقاس (Size)", value: "المقاس" },
        { label: "المادة (Material)", value: "المادة" },
        { label: "أخرى (Other)", value: "custom" }
    ];

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            <Card className="border-primary/20 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between bg-primary/5 rounded-t-xl">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            الخيارات والسمات
                        </CardTitle>
                        <CardDescription>اختر السمات التي تميز منتجك (مثل الألوان أو المقاسات)</CardDescription>
                    </div>
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => append({ name: "", options: [] })}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" /> إضافة سمة جديدة
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {fields.length === 0 && (
                        <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed border-muted-foreground/10">
                            <Settings className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold">ابدأ بإضافة أول سمة</h3>
                            <p className="text-sm text-muted-foreground mt-1">اضغط على زر (إضافة سمة جديدة) للبدء</p>
                        </div>
                    )}

                    {fields.map((field, idx) => {
                        const attributeName = watch(`attributes.${idx}.name`);
                        const isCustom = !PRESET_ATTRIBUTES.some(p => p.value === attributeName && attributeName !== "custom") || attributeName === "custom";

                        return (
                            <div key={field.id} className="p-6 border rounded-2xl bg-card relative group transition-all hover:border-primary/40 hover:shadow-lg">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -top-3 -left-3 bg-destructive text-white rounded-full w-8 h-8 hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    onClick={() => remove(idx)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    {/* Attribute Type Selection */}
                                    <div className="md:col-span-12 lg:col-span-4 space-y-4">
                                        <FormField
                                            control={control}
                                            name={`attributes.${idx}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold flex items-center gap-2">نوع السمة</FormLabel>
                                                    <Select
                                                        onValueChange={(val) => {
                                                            if (val === "custom") field.onChange("");
                                                            else field.onChange(val);
                                                        }}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="bg-muted/30 border-none h-12">
                                                                <SelectValue placeholder="اختر نوع السمة..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {PRESET_ATTRIBUTES.map(p => (
                                                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Fallback for Custom Name */}
                                        {isCustom && (
                                            <FormField
                                                control={control}
                                                name={`attributes.${idx}.name`}
                                                render={({ field }) => (
                                                    <FormItem className="animate-in slide-in-from-top-2">
                                                        <FormControl>
                                                            <Input
                                                                placeholder="اكتب اسم السمة المخصصة..."
                                                                className="h-10 border-primary/20 focus-visible:ring-primary"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    {/* Options (Values) for this Attribute */}
                                    <div className="md:col-span-12 lg:col-span-8">
                                        <FormField
                                            control={control}
                                            name={`attributes.${idx}.options`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold">الخيارات المتاحة (اكتب القيمة ثم اضغط Enter)</FormLabel>
                                                    <div className="border border-muted rounded-xl p-3 bg-muted/10 min-h-[50px] flex flex-wrap gap-2 focus-within:ring-1 ring-primary/20 transition-all">
                                                        {field.value.map((opt: string, oi: number) => (
                                                            <Badge key={oi} variant="secondary" className="px-3 py-1.5 gap-2 bg-background border-primary/10 hover:bg-destructive hover:text-white transition-colors cursor-pointer group/badge" onClick={() => {
                                                                const newOpts = [...field.value];
                                                                newOpts.splice(oi, 1);
                                                                field.onChange(newOpts);
                                                            }}>
                                                                {opt}
                                                                <Trash2 className="w-3 h-3 text-muted-foreground group-hover/badge:text-white" />
                                                            </Badge>
                                                        ))}
                                                        <Input
                                                            placeholder={field.value.length === 0 ? "مثال: أحمر، أخضر، أزرق..." : "أضف المزيد..."}
                                                            className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 h-8"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const val = e.currentTarget.value.trim();
                                                                    if (val && !field.value.includes(val)) {
                                                                        field.onChange([...field.value, val]);
                                                                        e.currentTarget.value = "";
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground italic flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> سيتم إنشاء المتغيرات تلقائياً بناءً على السمات التي تختارها هنا.
                        </div>
                        <Button
                            type="button"
                            size="lg"
                            className="gap-2 w-full md:w-auto bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200"
                            onClick={generate}
                            disabled={fields.length === 0}
                        >
                            <CopyPlus className="w-5 h-5 ml-2" /> إنشاء المتغيرات آلياً
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function VariantMatrixStep() {
    const { control, watch, setValue } = useFormContext<ProductFormData>();
    const variants = watch("variants") || [];
    const attributes = watch("attributes") || [];

    if (!variants?.length) return <div className="text-center py-20">يرجى إنشاء المتغيرات في الخطوة السابقة أولاً</div>;

    // Detect Row/Col attributes for Matrix
    const dim1 = attributes[0]?.name || "الخيار 1";
    const dim2 = attributes[1]?.name || null;
    const dim1Values = attributes[0]?.options || [];
    const dim2Values = attributes[1]?.options || ["default"];

    const getVariant = (v1: string, v2: string) => {
        return variants.find((v: any) =>
            v.attributes[dim1] === v1 && (dim2 ? v.attributes[dim2] === v2 : true)
        );
    };

    return (
        <Card className="animate-in slide-in-from-right-4 overflow-hidden">
            <CardHeader className="bg-muted/50">
                <CardTitle>مصفوفة المخزون</CardTitle>
                <CardDescription>حدد كمية المخزون لكل توليفة من الخيارات</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-bold text-center bg-muted/30">{dim1} \ {dim2 || ""}</TableHead>
                            {dim2Values.map(v2 => (
                                <TableHead key={v2} className="text-center">{v2 === "default" ? "الكمية" : v2}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dim1Values.map(v1 => (
                            <TableRow key={v1}>
                                <TableCell className="font-bold text-center bg-muted/20">{v1}</TableCell>
                                {dim2Values.map(v2 => {
                                    const variant = getVariant(v1, v2);
                                    if (!variant) return <TableCell key={v2} className="bg-muted/5" />;

                                    const index = variants.findIndex((v: any) => v.sku === variant.sku);
                                    return (
                                        <TableCell key={v2} className="p-2 text-center">
                                            <div className="space-y-1">
                                                <Input
                                                    type="number"
                                                    className="w-24 mx-auto text-center h-8"
                                                    value={variants[index].stock}
                                                    onChange={(e) => {
                                                        const newVal = [...variants];
                                                        newVal[index].stock = parseInt(e.target.value) || 0;
                                                        setValue("variants", newVal);
                                                    }}
                                                />
                                                <div className="flex items-center justify-center gap-2">
                                                    <Switch
                                                        checked={!!variants[index].isActive}
                                                        onCheckedChange={(val: boolean) => {
                                                            const newVal = [...variants];
                                                            newVal[index] = { ...newVal[index], isActive: val };
                                                            setValue("variants", newVal);
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-muted-foreground">نشط</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function VariantImagesStep({ onUpload }: { onUpload: any }) {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const attributes = watch("attributes");
    const colorImages = watch("colorImages") || {};

    // Find Color attribute
    const colorAttr = attributes.find((a: any) => a.name.toLowerCase() === 'color' || a.name === 'اللون');
    const colors = colorAttr?.options || [];

    if (colors.length === 0) return <div className="text-center py-20">لا يوجد خيار &quot;لون&quot; متاح لإضافة صور مخصصة</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-4">
            {colors.map(color => (
                <Card key={color} className="overflow-hidden">
                    <CardHeader className="bg-muted/40 py-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: color }} />
                            <CardTitle className="text-sm font-bold">صور اللون: {color}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <FileUploader
                            value={colorImages[color] || []}
                            onValueChange={(files) => onUpload(files, (urls: string[]) => {
                                setValue("colorImages", { ...colorImages, [color]: urls });
                            })}
                            dropzoneOptions={{
                                maxFiles: 3,
                                maxSize: 2 * 1024 * 1024,
                            }}
                        >
                            <FileInput className="border-2 border-dashed border-muted-foreground/20 h-24 flex items-center justify-center hover:bg-muted/50 transition-colors">
                                <ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" />
                            </FileInput>
                            <FileUploaderContent className="flex flex-row overflow-x-auto gap-2 pt-2">
                                {(colorImages[color] || []).map((url: string, i: number) => (
                                    <FileUploaderItem key={i} index={i} className="w-16 h-16 p-0 border rounded overflow-hidden">
                                        <img src={url} className="w-full h-full object-cover" />
                                    </FileUploaderItem>
                                ))}
                            </FileUploaderContent>
                        </FileUploader>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function PricingStep() {
    const { control, watch, setValue } = useFormContext<ProductFormData>();
    const attributes = watch("attributes");
    const colorPrices = watch("colorPrices") || {};
    const variants = watch("variants");

    const colorAttr = attributes.find((a: any) => a.name.toLowerCase() === 'color' || a.name === 'اللون');
    const colors = colorAttr?.options || [];

    if (colors.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>التسعير العام</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Label>السعر الافتراضي للمتغيرات:</Label>
                        <Input
                            type="number"
                            className="w-40"
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const newVars = variants.map((v: any) => ({ ...v, merchantPrice: val }));
                                setValue("variants", newVars);
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            <Card>
                <CardHeader>
                    <CardTitle>التسعير حسب اللون</CardTitle>
                    <CardDescription>يمكنك تحديد سعر مختلف لكل لون (اختياري)</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {colors.map(color => (
                        <div key={color} className="space-y-2 p-4 border rounded-xl bg-background">
                            <Label>سعر اللون: {color}</Label>
                            <Input
                                type="number"
                                value={colorPrices[color] || ""}
                                placeholder="0.00"
                                onChange={(e) => {
                                    setValue("colorPrices", { ...colorPrices, [color]: parseFloat(e.target.value) || 0 });
                                }}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>تعديل يدوي (اختياري)</CardTitle></CardHeader>
                <CardContent className="max-h-[300px] overflow-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead>المتغير (SKU)</TableHead><TableHead>السعر</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {variants.map((v: any, idx: number) => (
                                <TableRow key={v.sku}>
                                    <TableCell className="text-xs font-mono">{v.sku}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={v.merchantPrice}
                                            className="h-8 w-32"
                                            onChange={(e) => {
                                                const newVal = [...variants];
                                                newVal[idx].merchantPrice = parseFloat(e.target.value) || 0;
                                                setValue("variants", newVal);
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function ReviewStep() {
    const { watch } = useFormContext<ProductFormData>();
    const data = watch();

    return (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <Card className="border-green-100 bg-green-50/20">
                <CardHeader className="text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                    <CardTitle className="text-2xl font-bold">مراجعة المنتج النهائي</CardTitle>
                    <CardDescription>تأكد من كافة التفاصيل قبل الحفظ النهائي</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg">البيانات الأساسية</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between border-b pb-2"><span>الاسم:</span> <span className="font-bold">{data.name}</span></div>
                        <div className="flex justify-between border-b pb-2"><span>التصنيف:</span> <span className="font-bold text-primary">{data.category}</span></div>
                        <div className="flex justify-between border-b pb-2"><span>النوع:</span> <span>{data.productType === 'simple' ? 'بسيط' : 'متعدد المتغيرات'}</span></div>
                        <div className="flex justify-between"><span>الحالة:</span> <Badge variant={data.isActive ? 'outline' : 'secondary'}>{data.isActive ? 'نشط' : 'غير نشط'}</Badge></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg">الإحصائيات</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between border-b pb-2"><span>عدد الصور:</span> <span className="font-bold">{data.images.length}</span></div>
                        {data.productType === 'with_variants' ? (
                            <>
                                <div className="flex justify-between border-b pb-2"><span>عدد الخيارات:</span> <span className="font-bold">{data.attributes.length}</span></div>
                                <div className="flex justify-between"><span>إجمالي المتغيرات:</span> <span className="font-bold text-green-600">{data.variants.length}</span></div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between border-b pb-2"><span>السعر:</span> <span className="font-bold text-green-600 font-mono">{data.merchantPrice}</span></div>
                                <div className="flex justify-between"><span>المخزون:</span> <span className="font-bold">{data.stock}</span></div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>الصور</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    {data.images.map((img: string, i: number) => (
                        <img key={i} src={img} className="w-24 h-24 object-cover rounded-lg border shadow-sm hover:scale-105 transition-transform" />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}


