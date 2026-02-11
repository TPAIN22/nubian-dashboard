"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper"; // Assuming this exists or using simple list
import { ChevronRight, ChevronLeft, Save, Loader2 } from "lucide-react";

import { INITIAL_WIZARD_STATE, WizardState } from "./types";
import { buildProductPayload } from "./helpers/buildPayload";
import {
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
    ValidationResult
} from "./helpers/validateProduct";

import { Step1_BasicInfo } from "./steps/Step1_BasicInfo";
import { Step2_VariantSetup } from "./steps/Step2_VariantSetup";
import { Step3_VariantMatrix } from "./steps/Step3_VariantMatrix";
import { Step4_ColorImages } from "./steps/Step4_ColorImages";
import { Step5_Pricing } from "./steps/Step5_Pricing";
import { Step6_Review } from "./steps/Step6_Review";

interface Props {
    productId?: string;
    redirectPath?: string;
}

export default function ProductWizard({ productId, redirectPath = "/business/products" }: Props) {
    const router = useRouter();
    const { getToken } = useAuth();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!productId);
    const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

    const [currentStep, setCurrentStep] = useState(1);
    const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);

    // Fetch Categories
    useEffect(() => {
        const fetchCats = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const res = await axiosInstance.get("/categories", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(res.data || []);
            } catch (e) {
                toast.error("فشل تحميل التصنيفات");
            }
        };
        fetchCats();
    }, [getToken]);

    // Fetch Product if Edit Mode
    useEffect(() => {
        if (!productId) return;

        const fetchProduct = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const res = await axiosInstance.get(`/products/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const product = res.data.data || res.data;
                if (!product) {
                    toast.error("المنتج غير موجود");
                    router.push("/business/products");
                    return;
                }

                // Transform API response to WizardState
                // This is tricky because backend has variants but Wizard needs attributes + variants
                // Reversing the "buildPayload".

                const isVariant = product.variants && product.variants.length > 0;

                // Re-construct colorImages map?
                // We can try to infer it from variants images if they are consistent.
                const colorImages: Record<string, string[]> = {};
                // Find color attr
                const colorAttr = product.attributes?.find((a: any) => a.name.toLowerCase() === 'color' || a.name === 'اللون');
                if (colorAttr && product.variants) {
                    product.variants.forEach((v: any) => {
                        const color = v.attributes[colorAttr.name];
                        if (color && v.images && v.images.length > 0) {
                            colorImages[color] = v.images;
                        }
                    });
                }

                // Re-construct colorPrices map?
                const colorPrices: Record<string, number> = {};
                if (colorAttr && product.variants) {
                    product.variants.forEach((v: any) => {
                        const color = v.attributes[colorAttr.name];
                        if (color && v.merchantPrice) {
                            colorPrices[color] = v.merchantPrice;
                        }
                    });
                }

                setState({
                    name: product.name,
                    description: product.description,
                    category: product.category?._id || product.category,
                    isActive: product.isActive,
                    images: product.images || [],
                    productType: isVariant ? "with_variants" : "simple",
                    price: product.price || product.merchantPrice,
                    stock: product.stock,
                    attributes: product.attributes || [],
                    variants: product.variants || [],
                    colorImages,
                    colorPrices,
                });

            } catch (e) {
                toast.error("فشل تحميل بيانات المنتج");
            } finally {
                setFetching(false);
            }
        };
        fetchProduct();
    }, [productId, getToken, router]);

    const handleStateChange = (updates: Partial<WizardState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const validateCurrentStep = () => {
        let result: ValidationResult = { isValid: true, errors: {} };
        switch (currentStep) {
            case 1: result = validateStep1(state); break;
            case 2: result = validateStep2(state); break;
            case 3: result = validateStep3(state); break;
            case 4: result = validateStep4(state); break;
            case 5: result = validateStep5(state); break;
        }

        if (!result.isValid) {
            const msgs = Object.values(result.errors);
            if (msgs.length > 0) toast.error(msgs[0]);
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (validateCurrentStep()) {
            // Skip steps if Simple Product
            if (state.productType === "simple" && currentStep === 1) {
                // For simple product, go directly to Review (Step 6)
                // We're skipping 2,3,4,5
                setCurrentStep(6);
                return;
            }

            setCurrentStep(prev => Math.min(prev + 1, 6));
        }
    };

    const prevStep = () => {
        if (state.productType === "simple" && currentStep === 6) {
            setCurrentStep(1);
            return;
        }
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        setLoading(true);
        try {
            const token = await getToken();
            if (!token) throw new Error("No token");

            const payload = buildProductPayload(state);

            let res;
            if (productId) {
                res = await axiosInstance.put(`/products/${productId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                res = await axiosInstance.post(`/products`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            toast.success(productId ? "تمت تحديث المنتج بنجاح" : "تمت إضافة المنتج بنجاح");
            router.push(redirectPath);
        } catch (e: any) {
            toast.error("فشل حفظ المنتج: " + (e.response?.data?.message || String(e.message)));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
    }

    // Determine button label
    const isLastStep = currentStep === 6;

    return (
        <div className="max-w-5xl mx-auto py-6 px-4">
            {/* Steps Indicator - Simplified */}
            <div className="mb-8 overflow-x-auto">
                <div className="flex items-center min-w-max">

                    {[1, 2, 3, 4, 5, 6].map(step => (
                        <div key={step} className={`flex items-center ${step === 6 ? "" : "flex-1"}`}>
                            <div
                                className={`
                         w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border
                         min-w-[2rem] /* prevent shrinking */
                         ${step === currentStep ? "bg-primary text-primary-foreground border-primary" :
                                        step < currentStep ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}
                      `}
                            >
                                {step < currentStep ? "✓" : step}
                            </div>
                            <span className={`mx-2 text-xs md:text-sm ${step === currentStep ? "font-bold" : "text-muted-foreground hidden md:inline"}`}>
                                {step === 1 && "البيانات"}
                                {step === 2 && "الخيارات"}
                                {step === 3 && "المخزون"}
                                {step === 4 && "الصور"}
                                {step === 5 && "التسعير"}
                                {step === 6 && "المراجعة"}
                            </span>
                            {step !== 6 && <div className="h-[1px] bg-muted w-4 md:w-full mx-1" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                {currentStep === 1 && <Step1_BasicInfo state={state} onChange={handleStateChange} categories={categories} />}
                {currentStep === 2 && state.productType === "with_variants" && <Step2_VariantSetup state={state} onChange={handleStateChange} />}
                {currentStep === 3 && state.productType === "with_variants" && <Step3_VariantMatrix state={state} onChange={handleStateChange} />}
                {currentStep === 4 && state.productType === "with_variants" && <Step4_ColorImages state={state} onChange={handleStateChange} />}
                {currentStep === 5 && state.productType === "with_variants" && <Step5_Pricing state={state} onChange={handleStateChange} />}
                {currentStep === 6 && <Step6_Review state={state} onChange={handleStateChange} />}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1 || loading}
                >
                    <ChevronRight className="w-4 h-4 ml-2" />
                    السابق
                </Button>

                {isLastStep ? (
                    <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
                        {loading ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                        حفظ المنتج
                    </Button>
                ) : (
                    <Button onClick={nextStep} disabled={loading} className="min-w-[120px]">
                        التالي
                        <ChevronLeft className="w-4 h-4 mr-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
