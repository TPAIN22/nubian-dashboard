"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
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
    CopyPlus,
    PlusCircle
} from "lucide-react";
import Link from "next/link";

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

import {
    Alert,
    Button as AdminButton,
    Page,
    PageBody,
    PageHeader,
    Spinner,
    StatusBadge,
    StickyBar,
} from "@/components/admin";
import { formatCurrency } from "@/lib/currency";
import {
    WizardHelp,
    WizardNav,
    WizardSummary,
    type WizardStep,
} from "./WizardChrome";
import { clearProductDraft, formatSavedAt, useProductDraft } from "./useProductDraft";

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

    // Admin-only: which store the product belongs to. Merchants never see this —
    // the backend derives their merchant from the auth context. Required for
    // admins, enforced in onSubmit since the requirement depends on role.
    merchant: z.string().optional(),

    // Simple product fields
    merchantPrice: z.number().min(0).optional(),
    stock: z.number().min(0).optional(),

    // Complex product fields
    attributes: z.array(attributeSchema),
    variants: z.array(variantSchema),

    // UI Helpers (Transient)
    colorImages: z.record(z.array(z.string())),
    colorPrices: z.record(z.number()),
}).superRefine((data, ctx) => {
    // A "simple" product is still persisted as a single variant, and the backend
    // requires every variant to have merchantPrice > 0 and a non-negative integer
    // stock (product.model.js variantSchema: `merchantPrice` min 1; and
    // products.controller.js validateVariants). Enforce it here so the user gets
    // an inline field error instead of a 400 after clicking save.
    if (data.productType !== "simple") return;

    if (typeof data.merchantPrice !== "number" || data.merchantPrice < 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["merchantPrice"],
            message: "السعر مطلوب ويجب ألا يقل عن 1",
        });
    }

    if (
        typeof data.stock !== "number" ||
        data.stock < 0 ||
        !Number.isInteger(data.stock)
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["stock"],
            message: "الكمية مطلوبة ويجب أن تكون عدداً صحيحاً غير سالب",
        });
    }
});

/**
 * Placeholder attributes the wizard writes for a product that has no real
 * variant axes — `{ size: "os", color: "default" }`. Recognising them is what
 * lets a round-trip tell "simple" apart from "one-variant product".
 */
const isPlaceholderVariantAttrs = (attrs: any) => {
    const entries = Object.entries(attrs || {}).filter(([k]) => k !== "_id");
    if (entries.length === 0) return true;
    return entries.every(([k, v]) => {
        const key = k.toLowerCase();
        const val = String(v ?? "").toLowerCase();
        return (key === "size" && val === "os") || (key === "color" && val === "default");
    });
};

type ProductFormData = z.infer<typeof productSchema>;

/** Step-scoped guidance shown beside the form. Keyed by step number. */
const STEP_HELP: Record<number, string> = {
    1: "اختر «منتج بمتغيرات» فقط إذا كان للمنتج مقاسات أو ألوان مختلفة. المنتج البسيط ينتقل مباشرة إلى المراجعة.",
    2: "أضف السمة ثم قيمها (مثلاً: المقاس ← S، M، L)، ثم اضغط «توليد المتغيرات» لبناء كل التوليفات دفعة واحدة.",
    3: "يمكن تعديل الكمية والرمز لكل متغير على حدة. اترك المخزون صفراً للمتغيرات غير المتوفرة حالياً.",
    4: "الصور المرفوعة هنا تُستخدم لكل متغيرات اللون نفسه. إن لم تُضف صورة للون، تُستخدم صور المنتج الأساسية.",
    5: "السعر المُدخل هو سعر التاجر. تضيف المنصة هامشها فوقه عند العرض للعميل.",
    6: "راجع الملخص المجاور. أي حقل ناقص سيظهر بعلامة خطأ على خطوته في قائمة الخطوات.",
};

// ==========================================
// WIZARD COMPONENT
// ==========================================

interface Props {
    productId?: string;
    redirectPath?: string;
    addCategoryPath?: string;
    /**
     * Store to pre-select in the picker, passed by the route from `?merchant=`
     * (a store page's "add product" button). Ignored in edit mode and for
     * merchants, and dropped if it isn't an approved store the admin can post
     * to — a stale link must not silently attribute a product to the wrong shop.
     */
    defaultMerchantId?: string;
}

export default function ProductWizard({ productId, redirectPath = "/admin/products-advanced", addCategoryPath = "/admin/categories/new", defaultMerchantId }: Props) {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(1);

    // Same wizard serves /admin and /merchant. Admins must pick a store because
    // the backend has no merchant to infer from their token; merchants must not,
    // because it would let them post into someone else's store.
    const isAdmin = user?.publicMetadata?.role === "admin";

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
            merchant: "",
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

    // Autosaves the in-progress form to this browser. New products only — in
    // edit mode the server record is authoritative and a stale local copy would
    // silently resurrect old values. See useProductDraft.ts.
    const draft = useProductDraft<ProductFormData>({
        enabled: !productId,
        values: watch(),
        step: currentStep,
    });

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

    // Fetch Stores (admin only — /merchants is an admin-gated endpoint)
    const { data: merchants = [], isLoading: loadingMerchants } = useQuery({
        queryKey: ["admin-merchants"],
        enabled: isAdmin,
        queryFn: async () => {
            const token = await getToken();
            const res = await axiosInstance.get("/merchants", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const list = res.data?.data || res.data || [];
            // Only approved stores can hold sellable products.
            return (Array.isArray(list) ? list : []).filter((m: any) => m.status === "approved");
        }
    });

    // Pre-select the store the admin came from (/admin/stores/<id> → إضافة منتج).
    //
    // Applied once, and only after the store list resolves so an id that isn't
    // an approved store is discarded rather than silently submitted. The ref
    // guard matters: react-query hands back a new array on every refetch (window
    // focus is enough), and without it this would reset a store the admin had
    // since picked by hand.
    const merchantPrefilled = useRef(false);
    const canPrefillMerchant = Boolean(defaultMerchantId) && !productId && isAdmin;

    const applyDefaultMerchant = useCallback(() => {
        if (!canPrefillMerchant || loadingMerchants) return false;
        if (!merchants.some((m: any) => m._id === defaultMerchantId)) return false;
        setValue("merchant", defaultMerchantId!, { shouldValidate: true, shouldDirty: false });
        return true;
    }, [canPrefillMerchant, loadingMerchants, merchants, defaultMerchantId, setValue]);

    useEffect(() => {
        if (merchantPrefilled.current) return;
        if (applyDefaultMerchant()) merchantPrefilled.current = true;
    }, [applyDefaultMerchant]);

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

            // Normalize Arabic legacy attributes to prevent duplication in DB
            let normAttrs = (p.attributes || []).map((a: any) => {
                const options = a.options || a.values || [];
                let name = a.name;
                if (name === 'اللون') name = 'color';
                if (name === 'المقاس') name = 'size';
                if (name === 'المادة') name = 'material';
                return { ...a, name, options };
            });

            const normVars = (p.variants || []).map((v: any) => {
                const attrs = { ...v.attributes };
                if (attrs['اللون']) { attrs['color'] = attrs['اللون']; delete attrs['اللون']; }
                if (attrs['المقاس']) { attrs['size'] = attrs['المقاس']; delete attrs['المقاس']; }
                if (attrs['المادة']) { attrs['material'] = attrs['المادة']; delete attrs['المادة']; }
                return { ...v, attributes: attrs };
            });

            // Reconstruct attributes from variants if attributes array is completely missing
            if (normAttrs.length === 0 && normVars.length > 0) {
                const attrMap: Record<string, Set<string>> = {};
                normVars.forEach((v: any) => {
                    if (v.attributes) {
                        for (const [key, value] of Object.entries(v.attributes)) {
                            if (key && key !== '_id' && value && value !== 'default' && value !== 'os') {
                                if (!attrMap[key]) attrMap[key] = new Set();
                                attrMap[key].add(value as string);
                            }
                        }
                    }
                });
                normAttrs = Object.entries(attrMap).map(([name, optionsSet]) => ({
                    name,
                    options: Array.from(optionsSet)
                })).filter(a => a.options.length > 0);
            }

            // EVERY product is stored variant-first — `variants` is required and
            // must be non-empty (product.model.js), so a simple product is one
            // variant carrying the placeholder attributes. Testing
            // `variants.length > 0` therefore classified *every* product as
            // "with_variants", which is why editing a simple product dropped the
            // user into the variant flow and then failed to save.
            const soleVariant = normVars.length === 1 ? normVars[0] : null;
            const isSimple =
                normAttrs.length === 0 &&
                !!soleVariant &&
                isPlaceholderVariantAttrs(soleVariant.attributes);

            // There is no top-level `merchantPrice`/`price` on the product schema —
            // price and stock live on the variant. Reading them off the root gave
            // 0, which the backend then rejected with
            // "Variant merchantPrice is required and must be > 0".
            const mapped: ProductFormData = {
                name: p.name,
                description: p.description,
                category: p.category?._id || p.category,
                isActive: p.isActive ?? true,
                images: p.images || [],
                productType: isSimple ? "simple" : "with_variants",
                merchantPrice: Number(soleVariant?.merchantPrice ?? 0) || 1,
                stock: Number(soleVariant?.stock ?? p.stock ?? 0),
                // merchant comes back populated on GET — keep only the id.
                merchant: p.merchant?._id || p.merchant || "",
                attributes: normAttrs,
                variants: normVars,
                colorImages: {},
                colorPrices: {},
            };

            // Reconstruct color maps
            const colorAttr = normAttrs.find((a: any) => a.name === 'color' || a.name.toLowerCase() === 'color');
            if (colorAttr && normVars.length > 0) {
                normVars.forEach((v: any) => {
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
            // The product now exists on the server; the local draft is obsolete
            // and must not be offered back on the next visit.
            clearProductDraft();
            queryClient.invalidateQueries({ queryKey: ["products"] });
            router.push(redirectPath);
        },
        onError: (err: any) => {
            toast.error("خطأ: " + (err.response?.data?.message || err.message));
        }
    });

    // Helper: Build Payload for API
    const buildPayload = (data: ProductFormData) => {
        // Only the fields the wizard actually owns are sent. The previous version
        // spread the whole raw document (`_id`, `__v`, `slug`, `createdAt`,
        // `finalPrice`, the populated `merchant`…) back into the PUT body. The
        // update controller does `product.set(req.body)` — a partial merge — so
        // omitting a field preserves it. Echoing server-managed fields back was
        // pure risk with no benefit.
        const payload: any = {
            name: data.name,
            description: data.description,
            category: data.category,
            isActive: data.isActive,
            status: data.isActive ? "active" : "draft",
            images: data.images,
        };

        if (data.merchant) {
            payload.merchant = data.merchant;
        }

        if (data.productType === "simple") {
            // Backend requires a variant-first approach, so a simple product is
            // persisted as one placeholder variant.
            const existingSimple = (existingProduct as any)?.variants?.[0];

            payload.variants = [{
                // Keep the stored SKU on edit. Minting a fresh
                // `NAM-1234` on every save silently rotated the product's SKU and
                // risked colliding with the unique sparse index on variants.sku.
                sku:
                    existingSimple?.sku ||
                    `${data.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                // Preserve the subdocument id so this updates the existing variant
                // rather than replacing it with a new one.
                ...(existingSimple?._id ? { _id: existingSimple._id } : {}),
                merchantPrice: Number(data.merchantPrice) || 0,
                stock: Number(data.stock) || 0,
                isActive: true,
                images: data.images,
                attributes: { size: "os", color: "default" }
            }];
            // A simple product has no variant axes; clear any left over from a
            // product that was previously edited as a variant product.
            payload.attributes = [];
        } else {
            // Apply normalization on save payload to prevent DB duplicates
            payload.attributes = data.attributes.map(a => {
                if (a.name === 'اللون') return { ...a, name: 'color' };
                if (a.name === 'المقاس') return { ...a, name: 'size' };
                if (a.name === 'المادة') return { ...a, name: 'material' };
                return a;
            });

            const colorAttr = payload.attributes.find((a: any) => a.name.toLowerCase() === 'color');
            payload.variants = data.variants.map((v: any) => {
                const colorVal = colorAttr ? v.attributes[colorAttr.name] || v.attributes['اللون'] || "default" : "default";
                const fallbackImages = (data.colorImages && data.colorImages[colorVal]) || data.images;
                const fallbackPrice = (data.colorPrices && data.colorPrices[colorVal]) || 0;

                const cleanAttributes = { ...v.attributes };
                if (cleanAttributes["اللون"]) { cleanAttributes["color"] = cleanAttributes["اللون"]; delete cleanAttributes["اللون"]; }
                if (cleanAttributes["المقاس"]) { cleanAttributes["size"] = cleanAttributes["المقاس"]; delete cleanAttributes["المقاس"]; }
                if (cleanAttributes["المادة"]) { cleanAttributes["material"] = cleanAttributes["المادة"]; delete cleanAttributes["المادة"]; }

                return {
                    ...v,
                    merchantPrice: Number(v.merchantPrice || fallbackPrice),
                    stock: Number(v.stock || 0),
                    images: v.images?.length ? v.images : fallbackImages,
                    attributes: {
                        color: colorVal,
                        size: cleanAttributes.size || "os",
                        ...cleanAttributes
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
        const existingVariants = watch("variants") || [];

        // SKUs are unique across the WHOLE catalogue (Mongo: unique index on
        // variants.sku), not per product — and soft-deleted products keep theirs
        // reserved. A name-and-attributes SKU therefore collides the moment two
        // products share their first 3 characters and an option value
        // ("طقم … مقاس 37" twice), and the save fails at the DB. The random
        // suffix makes each generated SKU unique while staying readable.
        const uniqueSuffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();

        const sameAttributes = (a: Record<string, string>, b: Record<string, string>) => {
            const keys = Object.keys(a);
            return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
        };

        const newVariants = combinations.map((combo) => {
            const variantAttrs: Record<string, string> = {};
            attributes.forEach((attr, i) => { variantAttrs[attr.name] = combo[i]; });

            // Re-generating over an existing set must not churn SKUs that are
            // already saved on this product.
            const existing = existingVariants.find((v) => v.attributes && sameAttributes(v.attributes, variantAttrs));

            const sku = existing?.sku
                || `SKU-${productName.slice(0, 3).toUpperCase()}-${combo.join("-").toUpperCase()}-${uniqueSuffix()}`;
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
            // A simple product enters its price and stock on step 1 and then
            // jumps straight to review, so those two fields must be validated
            // here — otherwise the only thing that catches an empty price is the
            // backend, as a 400 on the very last click.
            1: productType === "simple"
                ? ["name", "description", "category", "images", "productType", "merchantPrice", "stock"]
                : ["name", "description", "category", "images", "productType"],
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

        // Zod cannot express "required only for admins", so gate it here rather
        // than letting the backend reject the whole wizard at the final step.
        if (isAdmin && currentStep === 1 && !watch("merchant")) {
            toast.warning("يرجى اختيار المتجر");
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

    const goToStep = (stepNum: number) => {
        if (productType === "simple" && stepNum > 1 && stepNum < 6) return;
        setCurrentStep(stepNum);
    };

    const stepHasError = (stepNum: number) => {
        const stepFieldsMap: Record<number, string[]> = {
            1: ["name", "description", "category", "images", "productType", "merchantPrice", "stock"], 
            2: ["attributes", "merchantPrice", "stock"],
            3: ["variants"],
            4: ["colorImages"],
            5: ["colorPrices"],
        };
        const fieldsToCheck = stepFieldsMap[stepNum] || [];
        return fieldsToCheck.some(f => !!errors[f as keyof typeof errors]);
    };

    // ── Step model ─────────────────────────────────────────────────────────
    // `skipped` must be evaluated before `done`: on a simple product the user
    // jumps 1 → 6, which would otherwise mark the variant steps as completed.
    const isSimple = productType === "simple";

    const STEP_DEFS: { num: number; title: string; hint: string }[] = [
        { num: 1, title: "البيانات الأساسية", hint: "الاسم، الوصف، التصنيف والصور" },
        { num: 2, title: "الخيارات والسمات", hint: "حدّد المقاسات والألوان" },
        { num: 3, title: "المخزون والكميات", hint: "كمية ورمز لكل متغير" },
        { num: 4, title: "صور الألوان", hint: "صورة مخصصة لكل لون" },
        { num: 5, title: "التسعير", hint: "سعر التاجر لكل متغير" },
        { num: 6, title: "المراجعة والنشر", hint: "تأكد من كل شيء قبل الحفظ" },
    ];

    const wizardSteps: WizardStep[] = STEP_DEFS.map((s) => {
        let state: WizardStep["state"];
        if (isSimple && s.num > 1 && s.num < 6) state = "skipped";
        else if (stepHasError(s.num)) state = "error";
        else if (currentStep === s.num) state = "current";
        else if (currentStep > s.num) state = "done";
        else state = "upcoming";
        return { ...s, state };
    });

    const activeStep = STEP_DEFS.find((s) => s.num === currentStep);

    // Status line for the sticky action bar. Save state outranks draft state,
    // which outranks the plain step counter.
    const barStatus = (() => {
        if (mutation.isPending) return "جارٍ الحفظ…";
        if (mutation.isError) return "فشل الحفظ — راجع رسالة الخطأ";
        if (!productId && draft.status === "saved")
            return `حُفظت المسودة تلقائياً ${formatSavedAt(draft.savedAt)}`;
        if (!productId && draft.status === "saving") return "جارٍ حفظ المسودة…";
        return `الخطوة ${currentStep} من 6`;
    })();

    // ── Live summary ───────────────────────────────────────────────────────
    const categoryName = (categories as any[]).find((c: any) => c._id === watch("category"))?.name;
    const storeName = isAdmin
        ? (merchants as any[]).find((m: any) => m._id === watch("merchant"))
            ? (() => {
                  const m = (merchants as any[]).find((x: any) => x._id === watch("merchant"));
                  return m?.businessName || m?.storeName || m?.name;
              })()
            : ""
        : undefined;

    // For a variant product the headline price is the cheapest variant — the
    // same "from" price a shopper sees on a listing.
    const summaryPrice = isSimple
        ? watch("merchantPrice")
        : (() => {
              const prices = [
                  ...variants.map((v: any) => Number(v?.merchantPrice) || 0),
                  ...Object.values(watch("colorPrices") || {}).map((p) => Number(p) || 0),
              ].filter((p) => p > 0);
              return prices.length ? Math.min(...prices) : undefined;
          })();

    if (loadingProduct || loadingCats) {
        return (
            <Page>
                <PageHeader title={productId ? "تعديل منتج" : "منتج جديد"} />
                <PageBody>
                    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
                        <Spinner className="size-5" />
                        <p className="text-[12px] text-text-muted">جارٍ تحميل بيانات المنتج…</p>
                    </div>
                </PageBody>
            </Page>
        );
    }

    return (
        <Form {...form}>
            <Page>
                <PageHeader
                    title={productId ? "تعديل منتج" : "منتج جديد"}
                    backHref={redirectPath}
                    meta={
                        <StatusBadge
                            tone={watch("isActive") ? "success" : "neutral"}
                            label={watch("isActive") ? "سيُنشر" : "مسودة"}
                        />
                    }
                    actions={
                        <AdminButton variant="ghost" size="sm" asChild>
                            <Link href={redirectPath}>إلغاء</Link>
                        </AdminButton>
                    }
                />

                <PageBody variant="flush">
                    <div className="px-6 py-5">
                        {/* Draft recovery — offered once, before any keystroke
                            overwrites the stored copy. */}
                        {draft.pending && (
                            <Alert
                                tone="info"
                                title="لديك مسودة غير محفوظة"
                                className="mb-5"
                                action={
                                    <div className="flex gap-2">
                                        <AdminButton
                                            size="sm"
                                            variant="primary"
                                            onClick={() => {
                                                const restored = draft.restore();
                                                if (restored) {
                                                    reset(restored.values as ProductFormData);
                                                    setCurrentStep(restored.step || 1);
                                                    // reset() overwrites the store the URL pre-selected
                                                    // with whatever the draft was saved against. Arriving
                                                    // from a specific store page is the more deliberate
                                                    // signal, so re-apply it.
                                                    applyDefaultMerchant();
                                                    toast.success("تمت استعادة المسودة");
                                                }
                                            }}
                                        >
                                            استعادة
                                        </AdminButton>
                                        <AdminButton size="sm" variant="ghost" onClick={draft.discard}>
                                            تجاهل
                                        </AdminButton>
                                    </div>
                                }
                            >
                                حُفظت تلقائياً {formatSavedAt(draft.pending.savedAt)} على هذا المتصفح.
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_270px]">
                            {/* Step rail */}
                            <div className="lg:sticky lg:top-4 lg:self-start">
                                <WizardNav steps={wizardSteps} onSelect={goToStep} />
                                <div className="mt-4 hidden lg:block">
                                    <WizardHelp title="نصيحة">
                                        <p>{STEP_HELP[currentStep]}</p>
                                    </WizardHelp>
                                </div>
                            </div>

                            {/* Step content */}
                            <div className="min-w-0">
                                {activeStep && (
                                    <div className="mb-4 border-b border-border pb-3">
                                        <h2 className="text-[15px] font-semibold tracking-[-0.008em] text-foreground">
                                            {activeStep.title}
                                        </h2>
                                        <p className="mt-0.5 text-[12px] text-text-muted">{activeStep.hint}</p>
                                    </div>
                                )}

                                {currentStep === 1 && <BasicInfoStep categories={categories} onUpload={handleImageUpload} addCategoryPath={addCategoryPath} showMerchantPicker={isAdmin} merchants={merchants} loadingMerchants={loadingMerchants} />}
                                {currentStep === 2 && productType === "with_variants" && <VariantSetupStep generate={generateVariants} />}
                                {currentStep === 3 && productType === "with_variants" && <VariantMatrixStep />}
                                {currentStep === 4 && productType === "with_variants" && <VariantImagesStep onUpload={handleImageUpload} />}
                                {currentStep === 5 && productType === "with_variants" && <PricingStep />}
                                {currentStep === 6 && <ReviewStep />}
                            </div>

                            {/* Live preview */}
                            <aside className="hidden xl:block xl:sticky xl:top-4 xl:self-start">
                                <WizardSummary
                                    data={{
                                        name: watch("name"),
                                        categoryName,
                                        storeName,
                                        images: watch("images") || [],
                                        productType: productType as "simple" | "with_variants",
                                        price: summaryPrice,
                                        stock: watch("stock"),
                                        variantCount: variants.length,
                                        attributeCount: attributes.length,
                                        isActive: !!watch("isActive"),
                                        formatPrice: (n) => formatCurrency(n || 0),
                                        priceCaption: "سعر التاجر — قبل هامش المنصة",
                                    }}
                                />
                            </aside>
                        </div>
                    </div>
                </PageBody>

                {/* Floating action rail — always reachable, never scrolled past. */}
                <StickyBar status={barStatus}>
                    <AdminButton
                        variant="secondary"
                        size="md"
                        onClick={prevStep}
                        disabled={currentStep === 1 || mutation.isPending}
                    >
                        <ChevronRight className="rtl:rotate-0" />
                        السابق
                    </AdminButton>

                    {currentStep < 6 ? (
                        <AdminButton variant="primary" size="md" onClick={nextStep}>
                            التالي
                            <ChevronLeft />
                        </AdminButton>
                    ) : (
                        <AdminButton
                            variant="primary"
                            size="md"
                            loading={mutation.isPending}
                            onClick={handleSubmit(
                                (d) => mutation.mutate(d as any),
                                (formErrors) => {
                                    console.log("Form Validation Errors:", formErrors);
                                    toast.error("لا يمكن الحفظ: يرجى مراجعة الحقول المميزة بعلامة خطأ في قائمة الخطوات");
                                }
                            )}
                        >
                            <Save />
                            {productId ? "حفظ التعديلات" : "نشر المنتج"}
                        </AdminButton>
                    )}
                </StickyBar>
            </Page>
        </Form>
    );
}

// ==========================================
// SUB-COMPONENTS (STEPS)
// ==========================================

function BasicInfoStep({ categories, onUpload, addCategoryPath, showMerchantPicker = false, merchants = [], loadingMerchants = false }: { categories: any[]; onUpload: any; addCategoryPath: string; showMerchantPicker?: boolean; merchants?: any[]; loadingMerchants?: boolean }) {
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
                    {showMerchantPicker && (
                        <FormField
                            control={control}
                            name="merchant"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">المتجر</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder={loadingMerchants ? "جاري تحميل المتاجر..." : "اختر المتجر"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {merchants.map((m: any) => (
                                                <SelectItem key={m._id} value={m._id}>
                                                    {m.storeName}
                                                    {m.claimStatus === "unclaimed" ? " — غير مرتبط بمستخدم" : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        المنتج سيُنسب إلى هذا المتجر.{" "}
                                        <Link href="/admin/stores" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
                                            إنشاء متجر جديد
                                        </Link>
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
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
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11"><SelectValue placeholder="اختر تصنيفاً" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        لا تجد التصنيف المناسب؟{" "}
                                        <Link
                                            href={addCategoryPath}
                                            className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                                        >
                                            <PlusCircle className="h-3.5 w-3.5" />
                                            أضف فئة جديدة
                                        </Link>
                                    </p>
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
                                                    {i === 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-[10px] text-white text-center py-0.5 font-bold shadow-sm pointer-events-none">الرئيسية</div>
                                                    )}
                                                    {i !== 0 && (
                                                        <div
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const newImages = [...field.value];
                                                                newImages.splice(i, 1);
                                                                newImages.unshift(url);
                                                                field.onChange(newImages);
                                                            }}
                                                            className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-[10px] text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-bold z-10 hover:bg-black/80">
                                                            تعيين رئيسية
                                                        </div>
                                                    )}
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
        { label: "اللون (Color)", value: "color" },
        { label: "المقاس (Size)", value: "size" },
        { label: "المادة (Material)", value: "material" },
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
                            <TableHead className="font-bold text-center bg-muted/30">
                                {dim1 === "color" || dim1 === "اللون" ? "اللون" : dim1 === "size" || dim1 === "المقاس" ? "المقاس" : dim1 === "material" ? "المادة" : dim1} \ {dim2 ? (dim2 === "color" || dim2 === "اللون" ? "اللون" : dim2 === "size" || dim2 === "المقاس" ? "المقاس" : dim2 === "material" ? "المادة" : dim2) : ""}
                            </TableHead>
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
                            <FileUploaderContent className="flex flex-row flex-wrap gap-2 pt-2">
                                {(colorImages[color] || []).map((url: string, i: number) => (
                                    <FileUploaderItem key={i} index={i} className="w-16 h-16 p-0 border rounded-md overflow-hidden group relative">
                                        <img src={url} className="w-full h-full object-cover" />
                                        {i === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-[10px] text-white text-center py-0.5 font-bold shadow-sm pointer-events-none">الرئيسية</div>
                                        )}
                                        {i !== 0 && (
                                            <div
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const currentImages = [...(colorImages[color] || [])];
                                                    currentImages.splice(i, 1);
                                                    currentImages.unshift(url);
                                                    setValue("colorImages", { ...colorImages, [color]: currentImages });
                                                }}
                                                className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-[10px] text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-bold leading-tight text-center z-10 hover:bg-black/80">
                                                تعيين<br />رئيسية
                                            </div>
                                        )}
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


