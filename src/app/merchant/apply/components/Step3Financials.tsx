"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { MerchantRegistrationData } from "../schema";

export default function Step3Financials() {
  const { register, formState: { errors } } = useFormContext<MerchantRegistrationData>();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1 border-b pb-2">الإعدادات المالية</h3>
        <p className="text-sm text-muted-foreground mb-6">أدخل تفاصيل حسابك البنكي بأمان حتى تتمكن من استلام أرباحك.</p>
      </div>

      <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex gap-3 items-start">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-sm">
          بياناتك البنكية مشفرة ومحفوظة بشكل آمن. نحن نستخدمها فقط لمعالجة أرباح المبيعات الخاصة بك تلقائياً.
        </p>
      </div>

      <div className="space-y-4">
        {/* IBAN */}
        <div>
          <Label htmlFor="iban" className="font-semibold block mb-1.5">
            رقم الحساب البنكي الدولي (الآيبان) <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="iban"
            placeholder="مثال: SD12..." 
            {...register("iban")} 
            className={`font-mono uppercase tracking-wider text-left ${errors.iban ? "border-red-500" : ""}`}
            onChange={(e) => {
              // Auto-uppercase the input
              e.target.value = e.target.value.toUpperCase();
              register("iban").onChange(e);
            }}
            dir="ltr"
          />
          {errors.iban ? (
            <p className="text-sm text-red-500 mt-1">{errors.iban.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1.5">تأكد من كتابة الآيبان بشكل صحيح بدون مسافات.</p>
          )}
        </div>
      </div>
    </div>
  );
}
