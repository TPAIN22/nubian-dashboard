"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axiosInstance";
import logger from "@/lib/logger";

import { Sparkles } from "lucide-react";
import {
  ChevronRight,
  ChevronLeft,
  Package,
  Store,
  Info,
  CheckCircle2,
  Type,
  Layers,
  Image as ImageIcon,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUpload from "@/components/imageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { AttributeDefinitionManager } from "@/components/product/AttributeDefinitionManager";
import { VariantManager } from "@/components/product/VariantManager";
import { PricingPreview } from "@/components/product/PricingPreview";
import { VariantPricingPreview } from "@/components/product/VariantPricingPreview";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  normalizeProductPayload, 
  validateVariantPricing,
  FormVariant 
} from "@/lib/products/normalizeProductPayload";

const formSchema = z
  .object({
    name: z.string().min(1, "اسم المنتج مطلوب"),
    description: z.string().min(1, "الوصف مطلوب"),
    category: z.string().min(1, "الفئة مطلوبة"),
    images: z.array(z.string()).min(1, "صورة واحدة على الأقل مطلوبة").max(10, "لا يمكن رفع أكثر من 10 صور"),

    productType: z
      .string()
      .refine((val) => val === "" || val === "simple" || val === "with_variants", {
        message: "نوع المنتج يجب أن يكون بسيط أو بمتغيرات",
      }),

    // Smart pricing fields
    merchantPrice: z.number().min(0.01, "سعر التاجر يجب أن يكون أكبر من 0").optional().or(z.undefined()),
    nubianMarkup: z
      .number()
      .min(0, "هامش نوبيان لا يمكن أن يكون سالباً")
      .max(100, "هامش نوبيان لا يمكن أن يتجاوز 100%")
      .optional()
      .or(z.undefined()),

    // Legacy fields
    price: z.number().min(0.01, "السعر يجب أن يكون أكبر من 0").optional().or(z.undefined()),
    stock: z.number().int().min(0, "المخزون لا يمكن أن يكون سالباً").optional().or(z.undefined()),

    attributes: z
      .array(
        z.object({
          name: z.string().min(1),
          displayName: z.string().min(1),
          type: z.enum(["select", "text", "number"]),
          required: z.boolean(),
          options: z.array(z.string()).optional(),
        })
      )
      .optional(),

      variants: z.array(z.object({
        _id: z.string().optional(),
        sku: z.string().min(1),
        attributes: z.record(z.string()),
        // Variant price is OPTIONAL in UI - will use defaultVariantMerchantPrice as fallback
        merchantPrice: z.number().min(0).optional().or(z.literal("")),
        nubianMarkup: z.number().min(0).max(100).optional(),
      
        // keep price for backward compatibility
        price: z.number().min(0).optional().or(z.literal("")),
      
        stock: z.number().int().min(0),
        images: z.array(z.string()).optional(),
        isActive: z.boolean(),
      })).optional(),
      
      // Form-only fields for variant pricing (not sent to DB directly)
      defaultVariantMerchantPrice: z.number().min(0).optional().or(z.literal("")),
      samePriceForAllVariants: z.boolean().optional(),
      

    // Legacy fields
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),

    merchant: z.string().optional(),

    priorityScore: z.number().min(0).max(100).optional(),
    featured: z.boolean().optional(),

    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const productType = data.productType as string;
    if (!productType || (productType !== "simple" && productType !== "with_variants")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "نوع المنتج مطلوب",
        path: ["productType"],
      });
    }
  });

interface Category {
  _id: string;
  name: string;
}

interface Merchant {
  _id: string;
  businessName: string;
  businessEmail: string;
  status: string;
}

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [merchantsLoading, setMerchantsLoading] = useState(true);
  const isSubmittingRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);
  const maxStep = 5;
  const [isEdit] = useState(!!productId);

  // TRACK IMAGES SEPARATELY to avoid form corruption
  const [actualImages, setActualImages] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    // @ts-expect-error - react-hook-form type inference issue with zod union types
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      productType: "" as any,
      merchantPrice: undefined,
      nubianMarkup: 10,
      price: undefined,
      category: "",
      stock: undefined,
      attributes: [],
      variants: [],
      sizes: [],
      colors: [],
      images: [], // Always an array
      merchant: "",
      priorityScore: 0,
      featured: false,
      isActive: true,
      // New fields for variant pricing
      defaultVariantMerchantPrice: "" as any,
      samePriceForAllVariants: false,
    },
  });

  // Watch for images changes and ensure they stay as arrays
  const watchedImages = useWatch({ control: form.control, name: "images" });

  useEffect(() => {
    if (watchedImages && !Array.isArray(watchedImages)) {
      const fixedImages = typeof watchedImages === "string" ? [watchedImages] : [];
      form.setValue("images", fixedImages, { shouldValidate: false });
    }
  }, [watchedImages, form]);

  const formRef = useRef(form);
  const initialImageUrlsRef = useRef<string[]>([]);

  
    const productType = useWatch({ control: form.control, name: "productType" });
    const attributes = useWatch({ control: form.control, name: "attributes" });
    const variants = useWatch({ control: form.control, name: "variants" });
    const name = useWatch({ control: form.control, name: "name" });
    const description = useWatch({ control: form.control, name: "description" });
    const category = useWatch({ control: form.control, name: "category" });
    const merchantPrice = useWatch({ control: form.control, name: "merchantPrice" });
    const price = useWatch({ control: form.control, name: "price" });
    const stock = useWatch({ control: form.control, name: "stock" });
    const merchant = useWatch({ control: form.control, name: "merchant" });
    const nubianMarkup = useWatch({ control: form.control, name: "nubianMarkup" });
    const priorityScore = useWatch({ control: form.control, name: "priorityScore" });
    const featured = useWatch({ control: form.control, name: "featured" });
    const isActive = useWatch({ control: form.control, name: "isActive" });
  const images = useWatch({ control: form.control, name: "images" });
  // New watches for variant pricing
  const defaultVariantMerchantPrice = useWatch({ control: form.control, name: "defaultVariantMerchantPrice" });
  const samePriceForAllVariants = useWatch({ control: form.control, name: "samePriceForAllVariants" });
  // Keep form ref updated and track initial image URLs
  useEffect(() => {
    formRef.current = form;
    // Set initial URLs once when component mounts or when productId changes
    if (productId && Array.isArray(images) && images.length > 0 && initialImageUrlsRef.current.length === 0) {
      initialImageUrlsRef.current = [...images];
    } else if (!productId && initialImageUrlsRef.current.length === 0) {
      initialImageUrlsRef.current = [];
    }
  }, [form, productId, images]);

  const memoizedVariants = useMemo(() => {
    return (variants || []).map((v: any) => ({
      ...v,
      // Keep merchantPrice as-is (can be undefined for optional pricing)
      merchantPrice: v?.merchantPrice,
      price: v?.price,
      isActive: v?.isActive !== false,
    }));
  }, [variants]);
  
  // Convert variants to FormVariant for pricing calculations
  const formVariants: FormVariant[] = useMemo(() => {
    return (variants || []).map((v: any) => ({
      _id: v?._id,
      sku: v?.sku || "",
      attributes: v?.attributes || {},
      merchantPrice: v?.merchantPrice,
      nubianMarkup: v?.nubianMarkup,
      price: v?.price,
      stock: v?.stock ?? 0,
      images: v?.images,
      isActive: v?.isActive !== false,
    }));
  }, [variants]);

  useEffect(() => {
    if (!userLoaded) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const userRole = user.publicMetadata?.role as string | undefined;

    if (userRole === "admin" || userRole === "merchant") return;

    router.replace("/business/dashboard");
  }, [userLoaded, user, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token not available");

        const res = await axiosInstance.get("/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCategories(res.data || []);
      } catch (error) {
        logger.error("Failed to fetch categories", {
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error("فشل تحميل التصنيفات");
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchMerchants = async () => {
      setMerchantsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const res = await axiosInstance.get("/merchants", {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: "APPROVED" },
        });

        const merchantsData = res.data?.data || res.data?.merchants || res.data || [];
        setMerchants(Array.isArray(merchantsData) ? merchantsData : []);
      } catch (error) {
        logger.error("Failed to fetch merchants", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setMerchantsLoading(false);
      }
    };

    fetchCategories();
    fetchMerchants();

    if (productId) {
      const fetchProduct = async () => {
        try {
          const token = await getToken();
          if (!token) {
            toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.");
            router.push("/sign-in");
            return;
          }

          const res = await axiosInstance.get(`/products/${productId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          let product: any = null;
          if (res.data?.success && res.data?.data) product = res.data.data;
          else if (res.data) product = res.data;

          if (!product) {
            toast.error("المنتج غير موجود");
            router.push("/business/products");
            return;
          }

          const hasVariants = product.variants && product.variants.length > 0;

          // For variant products, check if there's a common price we can use as default
          let defaultVariantPrice: number | "" = "";
          if (hasVariants && product.variants && product.variants.length > 0) {
            // Check if all variants have the same price
            const prices = product.variants.map((v: any) => v.merchantPrice || v.price).filter((p: any) => p > 0);
            if (prices.length > 0) {
              const uniquePrices = [...new Set(prices)];
              if (uniquePrices.length === 1) {
                defaultVariantPrice = uniquePrices[0] as number;
              }
            }
          }
          
          form.reset({
            name: product.name,
            description: product.description || "",
            productType: hasVariants ? "with_variants" : "simple",
            merchantPrice: product.merchantPrice || product.price || undefined,
            nubianMarkup: product.nubianMarkup || 10,
            price: product.price || undefined,
            category: product.category?._id || product.category || "",
            stock: product.stock,
            attributes: product.attributes || [],
            variants: product.variants
              ? product.variants.map((v: any) => ({
                  ...v,
                  // Keep merchantPrice as-is to show existing prices
                  merchantPrice: v.merchantPrice || v.price || undefined,
                  price: v.price || v.merchantPrice || undefined,
                  attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : v.attributes,
                  isActive: v.isActive !== false,
                }))
              : [],
            sizes: product.sizes || [],
            colors: product.colors || [],
            images: Array.isArray(product.images) ? product.images : (product.images && typeof product.images === "string" ? [product.images] : []),
            merchant: product.merchant?._id || product.merchant || "",
            priorityScore: product.priorityScore || 0,
            featured: product.featured || false,
            isActive: product.isActive !== false,
            // New fields
            defaultVariantMerchantPrice: defaultVariantPrice,
            samePriceForAllVariants: false,
          });

          console.log("FORM INIT DEBUG: product.images:", product.images);
          console.log("FORM INIT DEBUG: setting form images to:", Array.isArray(product.images) ? product.images : (product.images && typeof product.images === "string" ? [product.images] : []));

          // Also set the separate state
          setActualImages(Array.isArray(product.images) ? product.images : (product.images && typeof product.images === "string" ? [product.images] : []));
        } catch (error) {
          logger.error("Failed to fetch product", {
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error("فشل تحميل المنتج");
        }
      };

      fetchProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, productId]);


  const stepStates = useMemo(() => {
    const states = {
      enabled: [true, false, false, false, false],
      completed: [false, false, false, false, false],
    };

    const currentValues = {
      name,
      description,
      category,
      productType,
      merchantPrice,
      price,
      stock,
      attributes,
      variants,
      images,
    };

    for (let i = 1; i <= 5; i++) {
      let isCompleted = false;

      switch (i) {
        case 1:
          isCompleted =
            !!currentValues.name?.trim() &&
            !!currentValues.description?.trim() &&
            !!currentValues.category?.trim();
          break;

        case 2:
          isCompleted =
            !!currentValues.productType &&
            (currentValues.productType === "simple" || currentValues.productType === "with_variants");
          break;

        case 3:
          if (currentValues.productType === "simple") {
            const mPrice = currentValues.merchantPrice || currentValues.price;
            isCompleted =
              mPrice !== undefined &&
              mPrice >= 0.01 &&
              currentValues.stock !== undefined &&
              currentValues.stock >= 0;
          } else {
            const hasAttrs = !!(currentValues.attributes && Array.isArray(currentValues.attributes) && currentValues.attributes.length > 0);
            const hasVars = !!(currentValues.variants && Array.isArray(currentValues.variants) && currentValues.variants.length > 0);
            isCompleted = hasAttrs && hasVars;
          }
          break;

        case 4:
          isCompleted = Array.isArray(currentValues.images) && currentValues.images.length > 0;
          break;

        case 5:
          isCompleted = true;
          break;
      }

      states.completed[i - 1] = isCompleted;

      if (i > 1) {
        let allPreviousCompleted = true;
        for (let j = 0; j < i - 1; j++) {
          if (!states.completed[j]) {
            allPreviousCompleted = false;
            break;
          }
        }
        states.enabled[i - 1] = allPreviousCompleted;
      }
    }

    return states;
  }, [name, description, productType, attributes, variants, images, category, merchantPrice, price, stock]);

  const isStepEnabled = useCallback(
    (step: number) => stepStates.enabled[step - 1] ?? false,
    [stepStates]
  );

  const isStepCompleted = useCallback(
    (step: number) => stepStates.completed[step - 1] ?? false,
    [stepStates]
  );

  const validateStepInline = useCallback(
    (step: number) => {
      const values = form.getValues();
      const errors = form.formState.errors;

      switch (step) {
        case 1:
          return (
            !errors.name &&
            !errors.description &&
            !errors.category &&
            !!values.name?.trim() &&
            !!values.description?.trim() &&
            !!values.category?.trim()
          );

        case 2: {
          const productTypeVal = values.productType as string;
          return (
            !errors.productType &&
            !!productTypeVal &&
            (productTypeVal === "simple" || productTypeVal === "with_variants")
          );
        }

        case 3:
          if (values.productType === "simple") {
            const merchantPrice = (values as any).merchantPrice || (values as any).price;
            return (
              !(errors as any).merchantPrice &&
              !errors.price &&
              !errors.stock &&
              merchantPrice !== undefined &&
              merchantPrice >= 0.01 &&
              values.stock !== undefined &&
              values.stock >= 0
            );
          } else {
            const hasAttributes = !!(values.attributes && Array.isArray(values.attributes) && values.attributes.length > 0);
            const hasVariants = !!(values.variants && Array.isArray(values.variants) && values.variants.length > 0);
            return hasAttributes && hasVariants;
          }

        case 4: {
          const imgArray = values.images || [];
          return !errors.images && Array.isArray(imgArray) && imgArray.length > 0;
        }

        case 5:
          return true;

        default:
          return false;
      }
    },
    [form]
  );

  const goToNextStep = useCallback(async () => {
    if (currentStep >= maxStep) return;

    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["name", "description", "category"];
        break;
      case 2:
        fieldsToValidate = ["productType"];
        break;
      case 3:
        if (productType === "simple") fieldsToValidate = ["price", "stock"];
        else fieldsToValidate = ["attributes", "variants"];
        break;
      case 4:
        fieldsToValidate = ["images"];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    const isStepValid = validateStepInline(currentStep);

    if (isValid && isStepValid) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.error("يرجى إكمال جميع الحقول المطلوبة في هذه المرحلة");
    }
  }, [currentStep, form, productType, validateStepInline]);

  const goToPreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleUploadDone = useCallback(
    (urls: string[]) => {
      console.log('handleUploadDone called with URLs:', urls);

      const validUrls = urls.filter(
        (url) =>
          url &&
          typeof url === "string" &&
          url.trim().length > 0 &&
          (url.startsWith("http://") || url.startsWith("https://"))
      );

      console.log('Filtered valid URLs:', validUrls);

      // UPDATE BOTH FORM AND SEPARATE STATE
      setActualImages(validUrls);

      const currentImages = formRef.current.getValues("images") || [];
      const urlsChanged = JSON.stringify(validUrls.sort()) !== JSON.stringify(currentImages.sort());

      console.log('Current images in form:', currentImages);
      console.log('URLs changed:', urlsChanged);

      if (urlsChanged) {
        // Ensure we always set an array value
        const imagesArray = Array.isArray(validUrls) ? validUrls : [];
        formRef.current.setValue("images", imagesArray, {
          shouldValidate: false, // Don't validate immediately to avoid premature errors
          shouldDirty: true,
          shouldTouch: true,
        });
        console.log('Set images to:', imagesArray);
      }
    },
    [] // Stable callback using ref
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmittingRef.current || loading) {
      logger.warn("Form submission blocked - already submitting");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    console.log("EDIT DEBUG: values.images at submit:", values.images);
    console.log("EDIT DEBUG: values.images type:", typeof values.images);
    console.log("EDIT DEBUG: values.images isArray:", Array.isArray(values.images));
    console.log("EDIT DEBUG: values.images length:", values.images?.length);

    // USE FORM VALUES FOR IMAGES, but ensure it's an array
    const currentImages = Array.isArray(values.images) ? values.images : [];

    if (!currentImages || currentImages.length < 1) {
      toast.error("يرجى رفع صورة واحدة على الأقل قبل الحفظ");
      isSubmittingRef.current = false;
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.");
        router.push("/sign-in");
        return;
      }

      const validImages = currentImages.filter(
        (img: string) =>
          img &&
          typeof img === "string" &&
          img.trim().length > 0 &&
          (img.startsWith("http://") || img.startsWith("https://"))
      );

      if (validImages.length === 0) {
        toast.error("يرجى رفع صورة واحدة على الأقل بصيغة صحيحة");
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      if (!values.description || String(values.description).trim().length === 0) {
        toast.error("يرجى إدخال وصف للمنتج");
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      if (!values.category || String(values.category).trim().length === 0) {
        toast.error("يرجى اختيار فئة للمنتج");
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      const productTypeVal = values.productType as string;
      if (!productTypeVal || (productTypeVal !== "simple" && productTypeVal !== "with_variants")) {
        toast.error("يرجى اختيار نوع المنتج");
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      const parseNumber = (value: any): number | undefined => {
        if (value === undefined || value === null || value === "") return undefined;
        if (typeof value === "number") return isNaN(value) ? undefined : value;
        const parsed = parseFloat(String(value));
        return isNaN(parsed) ? undefined : parsed;
      };

      if (values.productType === "simple") {
        const price = parseNumber(values.price);
        if (price === undefined || price <= 0) {
          toast.error("يرجى إدخال سعر صحيح (أكبر من 0)");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }

        const stock = parseNumber(values.stock);
        if (stock === undefined || stock < 0 || !Number.isInteger(stock)) {
          toast.error("يرجى إدخال مخزون صحيح (رقم صحيح أكبر من أو يساوي 0)");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }
      } else {
        if (!values.attributes || !Array.isArray(values.attributes) || values.attributes.length === 0) {
          toast.error("يرجى إضافة خاصية واحدة على الأقل للمنتج");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }

        if (!values.variants || !Array.isArray(values.variants) || values.variants.length === 0) {
          toast.error("يرجى إضافة متغير واحد على الأقل للمنتج");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }
        
        // Validate variant pricing
        const variantPricingValidation = validateVariantPricing(
          values.variants as FormVariant[],
          (values as any).defaultVariantMerchantPrice
        );
        if (!variantPricingValidation.valid) {
          toast.error(variantPricingValidation.errors.join("\n"));
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }
      }

      // USE currentImages directly (already validated above)

      const dataToSend: any = {
        name: String(values.name).trim(),
        description: String(values.description).trim(),
        category: String(values.category).trim(),
        images: currentImages, // Use the separate state
        isActive: values.isActive !== false,
      };

      console.log("🚀 DEBUG: Data being sent to backend:", JSON.stringify(dataToSend, null, 2));

      const userRole = user?.publicMetadata?.role as string | undefined;

      if (values.merchant && values.merchant.trim() && values.merchant !== "none" && values.merchant !== "") {
        dataToSend.merchant = values.merchant.trim();
      }

      if (values.productType === "simple") {
        const merchantPriceValue = parseNumber(values.merchantPrice) || parseNumber(values.price);
        const nubianMarkupValue = parseNumber(values.nubianMarkup) || 10;
        const stockValue = parseNumber(values.stock);

        if (merchantPriceValue !== undefined && merchantPriceValue > 0) {
          dataToSend.merchantPrice = merchantPriceValue;
          dataToSend.price = merchantPriceValue;
        } else {
          toast.error("خطأ في السعر. يرجى التحقق من القيمة المدخلة.");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }

        if (nubianMarkupValue !== undefined && nubianMarkupValue >= 0) {
          dataToSend.nubianMarkup = nubianMarkupValue;
        }

        if (stockValue !== undefined && stockValue >= 0) {
          dataToSend.stock = Math.floor(stockValue);
        } else {
          toast.error("خطأ في المخزون. يرجى التحقق من القيمة المدخلة.");
          isSubmittingRef.current = false;
          setLoading(false);
          return;
        }
      } else {
        // Use normalization function for variant products
        const normalizedPayload = normalizeProductPayload(
          {
            name: values.name,
            description: values.description,
            category: values.category,
            images: currentImages,
            isActive: values.isActive,
            attributes: values.attributes,
            variants: values.variants as FormVariant[],
            defaultVariantMerchantPrice: (values as any).defaultVariantMerchantPrice,
            samePriceForAllVariants: (values as any).samePriceForAllVariants,
            nubianMarkup: values.nubianMarkup,
          },
          "with_variants"
        );
        
        dataToSend.attributes = normalizedPayload.attributes || [];
        dataToSend.variants = normalizedPayload.variants || [];
        
        // Clear product-level pricing for variant products (per schema requirement)
        delete dataToSend.merchantPrice;
        delete dataToSend.price;
        delete dataToSend.stock;
      }

      if (userRole === "admin") {
        dataToSend.priorityScore = values.priorityScore || 0;
        dataToSend.featured = !!values.featured;
      }

      // FORCE images to be an array - last resort fix
      if (!Array.isArray(dataToSend.images)) {
        console.log("FORCED FIX: dataToSend.images was not an array:", dataToSend.images);
        dataToSend.images = dataToSend.images && typeof dataToSend.images === "string"
          ? [dataToSend.images]
          : [];
        console.log("FORCED FIX: dataToSend.images is now:", dataToSend.images);
      }


      logger.info("Sending product data to backend", {
        dataToSend: { ...dataToSend, imagesCount: dataToSend.images.length },
        userRole,
        userId: user?.id,
        isEdit,
      });

      const headers = { Authorization: `Bearer ${token}` };

      console.log("🚀 FINAL CHECK - About to make axios call:");
      console.log("dataToSend.images right before axios:", dataToSend.images);
      console.log("dataToSend.images type:", typeof dataToSend.images);
      console.log("dataToSend.images isArray:", Array.isArray(dataToSend.images));

      // One more forced fix right before axios
      if (!Array.isArray(dataToSend.images)) {
        console.log("🚨 EMERGENCY FIX: dataToSend.images was still not an array!");
        dataToSend.images = dataToSend.images && typeof dataToSend.images === "string"
          ? [dataToSend.images]
          : [];
        console.log("🚨 EMERGENCY FIX: dataToSend.images is now:", dataToSend.images);
      }

      console.log("Making axios PUT request with dataToSend:", JSON.stringify(dataToSend, null, 2));

      if (isEdit && productId) {
        // Since we're using currentImages directly in dataToSend, it should already be correct
        console.log("FINAL REQUEST DATA:", JSON.stringify(dataToSend, null, 2));

        const result = await axiosInstance.put(`/products/${productId}`, dataToSend, { headers });
        console.log("Axios PUT result:", result);

        toast.success("تم تحديث المنتج بنجاح");
        isSubmittingRef.current = false;
        setLoading(false);
        setTimeout(() => router.push("/business/products"), 500);
      } else {
        await axiosInstance.post("/products", dataToSend, { headers });
        toast.success("تم إنشاء المنتج بنجاح");

        isSubmittingRef.current = false;
        setLoading(false);

        form.reset({
          name: "",
          description: "",
          productType: "" as any,
          merchantPrice: undefined,
          nubianMarkup: 10,
          price: undefined,
          category: "",
          stock: undefined,
          attributes: [],
          variants: [],
          sizes: [],
          colors: [],
          images: [], // Always an array
          merchant: "",
          priorityScore: 0,
          featured: false,
          isActive: true,
          // Reset new fields
          defaultVariantMerchantPrice: "" as any,
          samePriceForAllVariants: false,
        });

        // Also reset the separate images state
        setActualImages([]);

        setCurrentStep(1);
        setTimeout(() => router.push("/business/products"), 500);
      }
    } catch (error: any) {
      isSubmittingRef.current = false;

      logger.error("Error saving product", {
        error: error instanceof Error ? error.message : String(error),
        status: error.response?.status,
        responseData: error.response?.data,
      });

      if (error.response?.status === 401) {
        toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.");
        router.push("/sign-in");
      } else if (error.response?.status === 403) {
        const errorData = error.response?.data;
        const errorCode = errorData?.code;
        const errorMessage = errorData?.message || errorData?.error?.message;
        const userRole = user?.publicMetadata?.role as string | undefined;

        logger.error("403 Forbidden error", {
          errorCode,
          errorMessage,
          userRole,
          errorData,
          userId: user?.id,
        });

        if (errorMessage) toast.error(errorMessage);
        else toast.error("ليس لديك صلاحية لإضافة منتجات. يرجى التحقق من صلاحياتك في Clerk.");
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data;
        const errorDetails = errorData?.error?.details || errorData?.details || errorData?.errors;

        if (errorDetails && Array.isArray(errorDetails)) {
          const errorMessages = errorDetails.map((e: any) => {
            const field = e.field || e.path || e.param || "unknown";
            const msg = e.message || e.msg || "Invalid value";
            return `${field}: ${msg}`;
          });
          toast.error(`خطأ في التحقق: ${errorMessages.join("; ")}`);
        } else if (errorDetails && typeof errorDetails === "string") {
          toast.error(`خطأ في التحقق: ${errorDetails}`);
        } else {
          const msg = errorData?.error?.message || errorData?.message || "خطأ في البيانات المرسلة. يرجى التحقق من جميع الحقول.";
          toast.error(msg);
        }
      } else {
        toast.error(error.response?.data?.message || "فشل حفظ المنتج");
      }
    } finally {
      if (isSubmittingRef.current) isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "المعلومات الأساسية",
      description: "الاسم والوصف والفئة",
      isCompleted: isStepCompleted(1),
      isActive: currentStep === 1,
      isEnabled: isStepEnabled(1),
    },
    {
      title: "نوع المنتج",
      description: "بسيط أو متغيرات",
      isCompleted: isStepCompleted(2),
      isActive: currentStep === 2,
      isEnabled: isStepEnabled(2),
    },
    {
      title: "تفاصيل المنتج",
      description: productType === "simple" ? "السعر والمخزون" : "الخصائص والمتغيرات",
      isCompleted: isStepCompleted(3),
      isActive: currentStep === 3,
      isEnabled: isStepEnabled(3),
    },
    {
      title: "الصور",
      description: "رفع صور المنتج",
      isCompleted: isStepCompleted(4),
      isActive: currentStep === 4,
      isEnabled: isStepEnabled(4),
    },
    {
      title: "المراجعة",
      description: "مراجعة وإرسال",
      isCompleted: false,
      isActive: currentStep === 5,
      isEnabled: isStepEnabled(5),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg bg-primary/10">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}</h1>
          <p className="text-muted-foreground">
            {isEdit ? "قم بتعديل معلومات المنتج" : "أضف منتجك الجديد إلى المتجر بسهولة"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "تعديل المنتج" : "إنشاء منتج جديد"}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {isEdit ? "قم بتعديل معلومات المنتج في جميع الخطوات" : "املأ جميع الخطوات لإضافة منتج جديد"}
            </p>
          </CardHeader>

          <CardContent>
            <div className="mb-8">
              <Stepper steps={steps} />
            </div>

            <Form {...form}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Form onSubmit triggered, currentStep:", currentStep);

                  if (currentStep === 5) {
                    console.log("Submitting form for step 5");
                    if (isSubmittingRef.current || loading) {
                      console.log("Submission blocked - already submitting");
                      return;
                    }

                    form.handleSubmit(
                      onSubmit as any,
                      (errors) => {
                        console.log("Form validation failed with errors:", errors);
                        logger.error("Form validation failed", { errors });
                        const errorMessages = Object.entries(errors).map(([key, error]: any) => {
                          if (error?.message) return `${key}: ${error.message}`;
                          return key;
                        });
                        toast.error(`خطأ في التحقق: ${errorMessages.join(", ")}`);
                      }
                    )(e);
                  } else {
                    console.log("Going to next step:", currentStep + 1);
                    goToNextStep();
                  }
                }}
                className="space-y-6"
              >
                {/* Step 1 */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Type className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">المعلومات الأساسية للمنتج</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control as any}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">اسم المنتج *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="مثال: فستان سهرة مخمل، هاتف سامسونج S24"
                                className="h-11 rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>سيظهر هذا الاسم للمتسوقين في المتجر</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">الوصف التفصيلي *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="اكتب وصفاً جذاباً وشاملاً لمميزات المنتج ومواصفاته..."
                                rows={5}
                                className="rounded-lg resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control as any}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">الفئة *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={categoriesLoading}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 rounded-lg">
                                    <SelectValue
                                      placeholder={
                                        categoriesLoading ? "جاري تحميل التصنيفات..." : "اختر فئة المنتج"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
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

                        {user?.publicMetadata?.role === "admin" && (
                          <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50/30 space-y-4">
                            <h4 className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              تحكم المسؤول (الترتيب والتميز)
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control as any}
                                name="merchant"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-semibold">التاجر المرتبط</FormLabel>
                                    <Select
                                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                                      value={field.value || "none"}
                                      disabled={merchantsLoading}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-11 rounded-lg bg-white">
                                          <SelectValue
                                            placeholder={merchantsLoading ? "جاري التحميل..." : "اختر تاجر (اختياري)"}
                                          />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="none">بدون تاجر (منتج عام)</SelectItem>
                                        {merchants.map((merchant) => (
                                          <SelectItem key={merchant._id} value={merchant._id}>
                                            {merchant.businessName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control as any}
                                name="priorityScore"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-semibold">أولوية الظهور (0-100)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        className="h-11 rounded-lg bg-white"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control as any}
                              name="featured"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-white shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel className="font-bold">تمييز المنتج (Featured)</FormLabel>
                                    <FormDescription>
                                      سيظهر هذا المنتج في قسم &quot;المميز&quot; وفي أعلى نتائج البحث
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      className="w-5 h-5 accent-primary"
                                      checked={field.value}
                                      onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">اختر نوع المنتج</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={cn(
                          "relative cursor-pointer rounded-xl border-2 p-6 transition-all hover:border-primary/50",
                          productType === "simple"
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-muted bg-card"
                        )}
                        onClick={() => {
                          form.setValue("productType", "simple");
                          form.trigger("productType");
                        }}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                              productType === "simple"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">منتج بسيط</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              للمنتجات التي لها سعر ومخزون واحد فقط (مثل كتاب، زجاجة عطر)
                            </p>
                          </div>
                          {productType === "simple" && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={cn(
                          "relative cursor-pointer rounded-xl border-2 p-6 transition-all hover:border-primary/50",
                          productType === "with_variants"
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-muted bg-card"
                        )}
                        onClick={() => {
                          // When switching to variants, pre-fill default price from current merchantPrice
                          const currentMerchantPrice = form.getValues("merchantPrice");
                          if (currentMerchantPrice && currentMerchantPrice > 0) {
                            const currentDefault = form.getValues("defaultVariantMerchantPrice" as any);
                            if (!currentDefault || currentDefault === "") {
                              form.setValue("defaultVariantMerchantPrice" as any, currentMerchantPrice);
                            }
                          }
                          form.setValue("productType", "with_variants");
                          form.trigger("productType");
                        }}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                              productType === "with_variants"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Layers className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">منتج بمتغيرات</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              للمنتجات التي لها أحجام، ألوان، أو مواصفات مختلفة (مثل الملابس، الإلكترونيات)
                            </p>
                          </div>
                          {productType === "with_variants" && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control as any}
                      name="productType"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3 */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {productType === "simple" ? "السعر والمخزون" : "الخصائص والمتغيرات"}
                    </h3>

                    {productType === "simple" ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control as any}
                            name="merchantPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>سعر التاجر *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === "" || value === null || value === undefined) {
                                        field.onChange(undefined);
                                      } else {
                                        const numValue = parseFloat(value);
                                        field.onChange(isNaN(numValue) ? undefined : numValue);
                                        form.setValue("price", isNaN(numValue) ? undefined : numValue);
                                      }
                                      form.trigger(["merchantPrice", "nubianMarkup"]);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>السعر الأساسي الذي يحدده التاجر</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control as any}
                            name="nubianMarkup"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>هامش ربح نوبيان (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="10"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === "" || value === null || value === undefined) {
                                        field.onChange(undefined);
                                      } else {
                                        const numValue = parseFloat(value);
                                        field.onChange(isNaN(numValue) ? undefined : numValue);
                                      }
                                      form.trigger(["merchantPrice", "nubianMarkup"]);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>نسبة هامش الربح الافتراضية (10% افتراضي)</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <PricingPreview
                          merchantPrice={form.watch("merchantPrice") || form.watch("price") || 0}
                          nubianMarkup={form.watch("nubianMarkup") || 10}
                          dynamicMarkup={0}
                        />

                        <FormField
                          control={form.control as any}
                          name="stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المخزون *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "" || value === null || value === undefined) {
                                      field.onChange(undefined);
                                    } else {
                                      const intValue = parseInt(value, 10);
                                      field.onChange(isNaN(intValue) ? undefined : intValue);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>تعريف الخصائص</CardTitle>
                            <p className="text-muted-foreground text-sm">
                              قم بتعريف الخصائص التي سيتم استخدامها في المتغيرات (مثل: الحجم، اللون، المادة)
                            </p>
                          </CardHeader>
                          <CardContent>
                            <AttributeDefinitionManager
                              attributes={attributes || []}
                              onChange={(attrs) => {
                                const normalized = (attrs || []).map((a: any) => ({
                                  ...a,
                                  type: a?.type ?? "select",
                                  required: a?.required ?? false,
                                  options: a?.options ?? [],
                                }));
                                form.setValue("attributes", normalized, { shouldValidate: false });
                              }}
                            />
                          </CardContent>
                        </Card>

                        {attributes && attributes.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>المتغيرات</CardTitle>
                              <p className="text-muted-foreground text-sm">
                                قم بإضافة المتغيرات للمنتج بناءً على الخصائص المعرفة
                              </p>
                            </CardHeader>
                            <CardContent>
                              <VariantManager
                                attributes={attributes || []}
                                variants={memoizedVariants}
                                onChange={(vars) => form.setValue("variants", vars as any, { shouldValidate: false })}
                                defaultVariantMerchantPrice={defaultVariantMerchantPrice}
                                onDefaultPriceChange={(price) => form.setValue("defaultVariantMerchantPrice", price as any, { shouldValidate: false })}
                                samePriceForAllVariants={samePriceForAllVariants}
                                onSamePriceToggle={(enabled) => form.setValue("samePriceForAllVariants", enabled, { shouldValidate: false })}
                                defaultNubianMarkup={nubianMarkup || 10}
                              />
                              
                              {/* Variant Pricing Preview */}
                              {variants && variants.length > 0 && (
                                <VariantPricingPreview
                                  variants={formVariants}
                                  defaultVariantMerchantPrice={defaultVariantMerchantPrice}
                                  defaultNubianMarkup={nubianMarkup || 10}
                                />
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4 */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">صور المنتج</h3>
                    </div>

                    <div className="bg-muted/30 p-6 rounded-xl border-2 border-dashed">
                      <Label className="mb-4 block text-center font-medium">
                        قم برفع صور المنتج (صورة واحدة على الأقل) *
                      </Label>

                      <ImageUpload onUploadComplete={handleUploadDone} initialUrls={initialImageUrlsRef.current} />

                      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Info className="w-4 h-4" />
                        <span>يُنصح برفع صور واضحة وذات خلفية بيضاء لأفضل النتائج.</span>
                      </div>

                      {images && images.length > 0 && (
                        <div className="mt-6">
                          <Separator className="mb-4" />
                          <div className="flex justify-between items-center px-2">
                            <span className="text-sm font-medium">عدد الصور المختارة:</span>
                            <Badge variant="secondary">{images.length}</Badge>
                          </div>
                        </div>
                      )}

                      {form.formState.errors.images && (
                        <p className="text-sm font-medium text-destructive mt-4 text-center">
                          {String(form.formState.errors.images.message || "")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5 */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">مراجعة معلومات المنتج</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 space-y-4">
                        {/* Primary Image Display */}
                        <div className="aspect-square rounded-xl border bg-muted/30 overflow-hidden relative group">
                          {images && images.length > 0 ? (
                            <img src={images[0]} alt="Product Preview" className="object-cover w-full h-full" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                              <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                              <span className="text-xs">لا توجد صور</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-black/50 backdrop-blur-sm border-none">الرئيسية</Badge>
                          </div>
                        </div>

                        {/* Image Selection Grid - Click to set as primary */}
                        {images && images.length > 1 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">انقر على صورة لجعلها الرئيسية:</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {images.map((img, i) => (
                                <button
                                  type="button"
                                  key={`img-select-${i}`} 
                                  className={cn(
                                    "aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-md relative",
                                    i === 0 
                                      ? "border-primary ring-2 ring-primary/20" 
                                      : "border-muted hover:border-primary/50"
                                  )}
                                  onClick={() => {
                                    if (i !== 0) {
                                      // Move clicked image to first position
                                      const newImages = [...images];
                                      const [selectedImg] = newImages.splice(i, 1);
                                      newImages.unshift(selectedImg);
                                      form.setValue("images", newImages, { shouldValidate: false });
                                      // Also update actualImages state if it exists
                                      if (typeof setActualImages === 'function') {
                                        setActualImages(newImages);
                                      }
                                    }
                                  }}
                                >
                                  <img 
                                    src={img} 
                                    alt={`Image ${i + 1}`} 
                                    className="object-cover w-full h-full" 
                                  />
                                  {i === 0 && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                      <CheckCircle2 className="w-6 h-6 text-primary drop-shadow-md" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center">
                              الصورة الرئيسية ستظهر أولاً للعملاء
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-6">
                        <div className="rounded-xl border p-6 bg-card space-y-4 shadow-sm">
                          <div className="flex justify-between items-start border-b pb-4">
                            <div className="space-y-1">
                              <h4 className="text-2xl font-bold">{name || "اسم غير محدد"}</h4>
                              <p className="text-sm text-muted-foreground">
                                {categories.find((c) => c._id === category)?.name || "فئة غير محددة"}
                              </p>
                            </div>
                            <Badge variant={isActive ? "default" : "outline"}>
                              {isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider">نوع المنتج</Label>
                              <div className="flex items-center gap-2">
                                {productType === "simple" ? <Package className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                <p className="font-semibold">{productType === "simple" ? "منتج بسيط" : "منتج بمتغيرات"}</p>
                              </div>
                            </div>

                            {user?.publicMetadata?.role === "admin" && merchant && (
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">التاجر</Label>
                                <div className="flex items-center gap-2 text-primary">
                                  <Store className="w-4 h-4" />
                                  <p className="font-semibold">
                                    {merchants.find((m) => m._id === merchant)?.businessName || "غير محدد"}
                                  </p>
                                </div>
                              </div>
                            )}

                            {productType === "simple" && (
                              <>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">السعر النهائي</Label>
                                  <p className="text-xl font-bold text-primary">
                                    {((merchantPrice || price || 0) *
                                      (1 + (nubianMarkup || 10) / 100)).toFixed(2)}{" "}
                                    ج.س
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    يشمل هامش ربح نوبيان ({nubianMarkup || 10}%)
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">المخزون المتوفر</Label>
                                  <p
                                    className={cn(
                                      "text-lg font-bold",
                                      (stock || 0) < 10 ? "text-destructive" : "text-foreground"
                                    )}
                                  >
                                    {stock ?? 0} قطعة
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="pt-4 border-t">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">الوصف</Label>
                            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 italic">
                              &quot;{description || "لا يوجد وصف متاح"}&quot;
                            </p>
                          </div>

                          {productType === "with_variants" && (
                            <div className="pt-4 border-t space-y-4">
                              <div className="flex gap-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-muted-foreground">عدد الخصائص</span>
                                  <Badge variant="outline" className="w-fit">
                                    {(attributes || []).length} خصائص
                                  </Badge>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-muted-foreground">عدد المتغيرات</span>
                                  <Badge variant="outline" className="w-fit">
                                    {(variants || []).length} متغيرات
                                  </Badge>
                                </div>
                              </div>

                              {variants?.some((v: any) => v.images && v.images.length > 0) && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">صور المتغيرات</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {(variants as any[])
                                      .filter((v) => v.images && v.images.length > 0)
                                      .map((v, i) => (
                                        <div key={i} className="relative group">
                                          <img
                                            src={v.images![0]}
                                            className="w-10 h-10 rounded border object-cover"
                                            alt={`Variant ${v.sku}`}
                                          />
                                          <div className="absolute -top-1 -right-1 bg-primary text-[8px] text-white rounded-full w-3 h-3 flex items-center justify-center">
                                            {v.images?.length}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          <p className="text-sm text-primary font-medium">
                            كل شيء يبدو جيداً! يمكنك الآن الضغط على {isEdit ? "تحديث" : "إنشاء"} لحفظ المنتج.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center gap-4 pt-8 mt-8 border-t">
                  <div className="flex gap-3">
                    {currentStep > 1 && (
                      <Button type="button" variant="outline" onClick={goToPreviousStep} className="h-11 px-6 font-medium">
                        <ChevronRight className="w-4 h-4 ml-2" />
                        العودة للسابق
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push("/business/products")}
                      className="h-11 px-6 text-muted-foreground hover:text-foreground"
                    >
                      إلغاء العملية
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    {currentStep < maxStep ? (
                      <Button
                        type="submit"
                        onClick={(e) => {
                          e.preventDefault();
                          goToNextStep();
                        }}
                        className="h-11 px-8 font-bold shadow-lg shadow-primary/20"
                      >
                        الاستمرار للخطوة التالية
                        <ChevronLeft className="w-4 h-4 mr-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={loading || isSubmittingRef.current}
                        className="h-11 px-10 font-bold shadow-lg shadow-primary/30 min-w-[160px]"
                      >
                        {loading || isSubmittingRef.current ? (
                          <>
                            <span className="animate-spin ml-2">⏳</span>
                            جاري الحفظ...
                          </>
                        ) : isEdit ? (
                          "تحديث المنتج النهائي"
                        ) : (
                          "إتمام إنشاء المنتج"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
