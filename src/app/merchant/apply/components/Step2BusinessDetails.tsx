"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MerchantRegistrationData } from "../schema";

export default function Step2BusinessDetails() {
  const { register, formState: { errors }, watch } = useFormContext<MerchantRegistrationData>();
  const merchantType = watch("merchantType");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1 border-b pb-2">وثائق العمل</h3>
        <p className="text-sm text-muted-foreground mb-6">يرجى إعلامنا بنوع تسجيلك القانوني للتحقق من هويتك.</p>
      </div>

      <div className="space-y-6">
        {/* Merchant Type Selector */}
        <div>
          <Label className="font-semibold block mb-3">أسجل كـ: <span className="text-red-500">*</span></Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`
              relative flex cursor-pointer rounded-lg border bg-card p-4 shadow-sm focus:outline-none 
              ${merchantType === 'individual' ? 'border-primary ring-1 ring-primary' : 'border-border'}
            `}>
              <input type="radio" value="individual" className="sr-only" {...register("merchantType")} />
              <span className="flex flex-1">
                <span className="flex flex-col">
                  <span className="block text-sm font-medium">فرد / عمل منزلي</span>
                  <span className="mt-1 flex items-center text-xs text-muted-foreground">
                    لا يتطلب سجل تجاري.
                  </span>
                </span>
              </span>
              <CheckCircleIcon active={merchantType === 'individual'} />
            </label>

            <label className={`
              relative flex cursor-pointer rounded-lg border bg-card p-4 shadow-sm focus:outline-none 
              ${merchantType === 'business' ? 'border-primary ring-1 ring-primary' : 'border-border'}
            `}>
              <input type="radio" value="business" className="sr-only" {...register("merchantType")} />
              <span className="flex flex-1">
                <span className="flex flex-col">
                  <span className="block text-sm font-medium">عمل مسجل (شركة/مؤسسة)</span>
                  <span className="mt-1 flex items-center text-xs text-muted-foreground">
                    يجب توفير سجل تجاري صالح.
                  </span>
                </span>
              </span>
              <CheckCircleIcon active={merchantType === 'business'} />
            </label>
          </div>
        </div>

        {/* National ID */}
        <div>
          <Label htmlFor="nationalId" className="font-semibold">الرقم الوطني / رقم الجواز <span className="text-red-500">*</span></Label>
          <Input
            id="nationalId"
            placeholder="أدخل رقم الهوية الخاص بك"
            {...register("nationalId")}
            className={`mt-1.5 ${errors.nationalId ? "border-red-500" : ""}`}
          />
          {errors.nationalId && <p className="text-sm text-red-500 mt-1">{errors.nationalId.message}</p>}
        </div>

        {/* Commercial Registration (Conditional) */}
        {merchantType === 'business' && (
          <div className="animate-in slide-in-from-top-2 fade-in">
            <Label htmlFor="crNumber" className="font-semibold">رقم السجل التجاري (CR) <span className="text-red-500">*</span></Label>
            <Input
              id="crNumber"
              placeholder="مثال: 1010101010"
              {...register("crNumber")}
              className={`mt-1.5 ${errors.crNumber ? "border-red-500" : ""}`}
            />
            {errors.crNumber && <p className="text-sm text-red-500 mt-1">{errors.crNumber.message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircleIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-primary' : 'text-transparent'}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}
