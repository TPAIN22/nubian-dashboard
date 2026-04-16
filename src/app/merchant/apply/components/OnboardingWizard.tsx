"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { merchantRegistrationSchema, MerchantRegistrationData } from "../schema";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2BusinessDetails from "./Step2BusinessDetails";
import Step3Financials from "./Step3Financials";
import Step4StoreProfile from "./Step4StoreProfile";
import Step5Review from "./Step5Review";
import { Button } from "@/components/ui/button";

const steps = [
  { id: 1, title: "المعلومات الأساسية", fields: ["storeName", "ownerName", "phone", "email"] },
  { id: 2, title: "تفاصيل العمل", fields: ["merchantType", "nationalId", "crNumber"] },
  { id: 3, title: "البيانات المالية", fields: ["iban"] },
  { id: 4, title: "ملف المتجر", fields: ["description", "categories", "city", "logoUrl", "productSamples"] },
  { id: 5, title: "المراجعة", fields: ["agreedToTerms"] },
];

export default function OnboardingWizard() {
  const { userId, isLoaded } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const methods = useForm<MerchantRegistrationData>({
    resolver: zodResolver(merchantRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      storeName: "",
      ownerName: "",
      phone: "",
      email: "",
      merchantType: "individual",
      nationalId: "",
      crNumber: "",
      iban: "",
      logoUrl: "",
      description: "",
      categories: [],
      city: "",
      productSamples: [],
      agreedToTerms: false,
    },
  });

  const { trigger, handleSubmit, reset } = methods;

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch('/api/merchant/my-status');
        const data = await res.json();

        if (data.hasApplication) {
          const app = data.application;

          if (app.status === 'needs_revision') {
            // Pre-fill form with existing data for revision
            reset({
              storeName: app.storeName,
              ownerName: app.ownerName,
              phone: app.phone,
              email: app.email,
              merchantType: app.merchantType,
              nationalId: app.nationalId,
              crNumber: app.crNumber || "",
              iban: app.iban,
              logoUrl: app.logoUrl || "",
              description: app.description,
              categories: app.categories || [],
              city: app.city,
              productSamples: app.productSamples || [],
              agreedToTerms: false, // Force re-agreement
            });
            toast.info("تم تحميل بيانات طلبك السابق لتعديله");
          } else if (app.status === 'pending') {
            router.push('/merchant/pending');
          } else if (app.status === 'approved') {
            router.push('/merchant/dashboard');
          }
        }
      } catch (error) {
        console.error("Error loading application status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded && userId) {
      loadStatus();
    } else if (isLoaded && !userId) {
      setIsLoading(false);
    }
  }, [isLoaded, userId, reset, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground font-medium">جاري تحميل بياناتك...</p>
      </div>
    );
  }

  const nextStep = async () => {
    const fieldsToValidate = steps.find(s => s.id === currentStep)?.fields;

    // Explicitly validate just the fields in the current step
    let isStepValid = true;
    if (fieldsToValidate && fieldsToValidate.length > 0) {
      isStepValid = await trigger(fieldsToValidate as any);
    }

    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح.");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: MerchantRegistrationData) => {
    if (!isLoaded) return;
    if (!userId) {
      toast.error("يجب عليك تسجيل الدخول لتقديم الطلب.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/merchant/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend Error Detail:", errorData);
        throw new Error(errorData.error || errorData.message || "Failed to submit application");
      }

      setIsSuccess(true);
      toast.success("تم إرسال الطلب بنجاح!");
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold mb-4">تم استلام طلبك!</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          شكراً لتقديم طلب للحصول على حساب تاجر. سيقوم فريقنا بمراجعة طلبك والرد عليك خلال 24 إلى 48 ساعة.
        </p>
        <Button onClick={() => router.push("/")} size="lg" className="px-8">
          العودة للصفحة الرئيسية
        </Button>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BasicInfo />;
      case 2: return <Step2BusinessDetails />;
      case 3: return <Step3Financials />;
      case 4: return <Step4StoreProfile />;
      case 5: return <Step5Review />;
      default: return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => Object.keys(methods.formState.errors).length > 0 && e.preventDefault()}>
        {/* Stepper Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black rounded-full z-0 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${currentStep >= step.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-background border-2 border-border text-muted-foreground'
                    }`}
                >
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span className={`absolute -bottom-6 text-xs whitespace-nowrap font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Form Content */}
        <div className="mt-12 mb-8 min-h-[300px] animate-in slide-in-from-right-4 fade-in duration-300">
          {renderStep()}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={`${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            السابق
          </Button>

          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep} className="min-w-[120px]">
              التالي
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
