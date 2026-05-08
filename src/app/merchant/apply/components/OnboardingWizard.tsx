"use client";

import React, { useState, useEffect, useCallback } from "react";
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

// Backend conflict codes → bilingual user-facing messages.
// Keep in sync with APPLY_CONFLICTS in apps/backend/src/controllers/merchant.controller.js.
const APPLY_ERROR_MESSAGES: Record<string, { ar: string; en: string }> = {
  APPLICATION_PENDING: {
    ar: "لديك طلب قيد المراجعة بالفعل.",
    en: "You already have an application under review.",
  },
  MERCHANT_APPROVED: {
    ar: "حسابك التجاري معتمد بالفعل.",
    en: "Your merchant account is already approved.",
  },
  MERCHANT_SUSPENDED: {
    ar: "تم تعليق حسابك التجاري. يرجى التواصل مع الدعم.",
    en: "Your merchant account is suspended. Please contact support.",
  },
  APPLICATION_CONFLICT: {
    ar: "لا يمكن إعادة تقديم الطلب في حالته الحالية.",
    en: "Application cannot be resubmitted in its current state.",
  },
  VALIDATION_ERROR: {
    ar: "يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح.",
    en: "Please fill in all required fields correctly.",
  },
  UNAUTHORIZED: {
    ar: "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.",
    en: "Your session has expired. Please sign in again.",
  },
};

function pickErrorMessage(code: string | undefined, fallbackAr: string, fallbackEn: string) {
  const entry = code ? APPLY_ERROR_MESSAGES[code] : undefined;
  return entry ?? { ar: fallbackAr, en: fallbackEn };
}

export default function OnboardingWizard() {
  const { userId, isLoaded, getToken, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hand the latest Clerk token to fetch in case the in-flight session was stale.
  // Cookies still drive auth in the App Router proxy, so this primarily forces
  // Clerk to refresh the JWT and any stale publicMetadata claims.
  const refreshClerkSession = useCallback(async () => {
    try {
      await getToken({ skipCache: true });
    } catch (err) {
      console.error("Failed to refresh Clerk session", err);
    }
  }, [getToken]);

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
    let cancelled = false;

    async function loadStatus() {
      // Try once; on 401, force a Clerk token refresh and retry once. This
      // recovers from the stale-session-after-deletion scenario where the
      // browser still holds a JWT for a Clerk user that no longer exists.
      const fetchStatus = async () => fetch('/api/merchant/my-status', { cache: 'no-store' });
      try {
        let res = await fetchStatus();

        if (res.status === 401) {
          await refreshClerkSession();
          res = await fetchStatus();
        }

        if (res.status === 401) {
          // Still unauthorized — the local session is unrecoverable.
          if (!cancelled) {
            toast.error(APPLY_ERROR_MESSAGES.UNAUTHORIZED.ar);
            await signOut();
            router.push('/sign-in?redirect_url=/merchant/apply');
          }
          return;
        }

        if (!res.ok) {
          // Don't block the wizard on a transient status fetch — let the user
          // try to apply; the POST will surface anything that's actually wrong.
          console.error('my-status non-OK', res.status);
          return;
        }

        const data = await res.json();
        if (cancelled || !data?.hasApplication) return;

        const app = data.application;
        if (!app) return;

        switch (app.status) {
          case 'needs_revision':
          case 'rejected': {
            // Both states let the user resubmit through this wizard; pre-fill
            // the form so they only have to edit what changed.
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
              agreedToTerms: false,
            });
            toast.info(
              app.status === 'needs_revision'
                ? "تم تحميل بيانات طلبك السابق لتعديله"
                : "يمكنك تعديل بياناتك وإعادة التقديم"
            );
            break;
          }
          case 'pending':
            router.push('/merchant/pending');
            break;
          case 'approved':
            router.push('/merchant/dashboard');
            break;
          case 'suspended':
            router.push('/merchant/pending');
            break;
          default:
            // Unknown status — surface the pending screen as a safe default.
            router.push('/merchant/pending');
        }
      } catch (error) {
        if (!cancelled) console.error("Error loading application status:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (isLoaded && userId) {
      loadStatus();
    } else if (isLoaded && !userId) {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, reset, router, refreshClerkSession, signOut]);

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
      toast.error(APPLY_ERROR_MESSAGES.UNAUTHORIZED.ar);
      return;
    }

    setIsSubmitting(true);
    try {
      const submit = () =>
        fetch("/api/merchant/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

      let response = await submit();

      // One-shot retry on 401 to recover from stale Clerk JWTs.
      if (response.status === 401) {
        await refreshClerkSession();
        response = await submit();
      }

      if (response.ok) {
        setIsSuccess(true);
        toast.success("تم إرسال الطلب بنجاح!");
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      const code: string | undefined = errorData?.error?.code ?? errorData?.code;
      const status: string | undefined = errorData?.error?.details?.status;
      console.error("Apply error", { httpStatus: response.status, code, status, errorData });

      if (response.status === 401) {
        toast.error(APPLY_ERROR_MESSAGES.UNAUTHORIZED.ar);
        await signOut();
        router.push('/sign-in?redirect_url=/merchant/apply');
        return;
      }

      if (response.status === 409) {
        // Route the user to the screen that actually matches their state.
        if (code === 'APPLICATION_PENDING' || status === 'pending') {
          toast.info(APPLY_ERROR_MESSAGES.APPLICATION_PENDING.ar);
          router.push('/merchant/pending');
          return;
        }
        if (code === 'MERCHANT_APPROVED' || status === 'approved') {
          toast.info(APPLY_ERROR_MESSAGES.MERCHANT_APPROVED.ar);
          router.push('/merchant/dashboard');
          return;
        }
        if (code === 'MERCHANT_SUSPENDED' || status === 'suspended') {
          toast.error(APPLY_ERROR_MESSAGES.MERCHANT_SUSPENDED.ar);
          router.push('/merchant/pending');
          return;
        }
        // Unknown 409 — show the backend's own bilingual message if present,
        // otherwise the generic conflict copy.
        const messageAr = errorData?.error?.details?.messageAr;
        const fallback = pickErrorMessage(code, "لا يمكن إعادة تقديم الطلب في حالته الحالية.", "Application cannot be resubmitted in its current state.");
        toast.error(messageAr || fallback.ar);
        return;
      }

      // Validation / other 4xx: prefer backend's Arabic copy, then English.
      const messageAr = errorData?.error?.details?.messageAr;
      const messageEn = errorData?.error?.message ?? errorData?.message;
      const fallback = pickErrorMessage(code, "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.", "Submission failed. Please try again.");
      toast.error(messageAr || fallback.ar || messageEn || fallback.en);
    } catch (error) {
      console.error(error);
      toast.error("تعذر الاتصال بالخادم. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.");
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
