"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MerchantRegistrationData } from "../schema";

export default function Step1BasicInfo() {
  const { register, formState: { errors }, setValue, watch } = useFormContext<MerchantRegistrationData>();
  const storeName = watch("storeName");

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleAiSuggest = async () => {
    if (!storeName || storeName.length < 2) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: storeName }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1 border-b pb-2">تفاصيل المتجر الأساسية</h3>
        <p className="text-sm text-muted-foreground mb-6">لنبدأ باسم علامتك التجارية وبيانات الاتصال الأساسية.</p>
      </div>

      <div className="space-y-4">
        {/* Store Name with AI */}
        <div>
          <Label htmlFor="storeName" className="font-semibold">اسم المتجر <span className="text-red-500">*</span></Label>
          <div className="flex mt-1.5 gap-2">
            <Input
              id="storeName"
              placeholder="مثال: إلكترونيات أم درمان"
              {...register("storeName")}
              className={errors.storeName ? "border-red-500" : ""}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAiSuggest}
              disabled={isAiLoading || !storeName || storeName.length < 2}
              className="px-3"
              title="احصل على اقتراحات ذكية بناءً على ما كتبته"
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          </div>
          {errors.storeName && <p className="text-sm text-red-500 mt-1">{errors.storeName.message}</p>}
        </div>

        {/* AI Suggestions Display */}
        {suggestions.length > 0 && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-top-2">
            <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> اقتراحات أسماء بالذكاء الاصطناعي
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setValue("storeName", sug, { shouldValidate: true });
                    setSuggestions([]);
                  }}
                  className="text-xs px-2.5 py-1 bg-background border border-border text-foreground rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Owner Name */}
        <div>
          <Label htmlFor="ownerName" className="font-semibold">الاسم الكامل للمالك <span className="text-red-500">*</span></Label>
          <Input
            id="ownerName"
            placeholder="مثال: أحمد علي"
            {...register("ownerName")}
            className={`mt-1.5 ${errors.ownerName ? "border-red-500" : ""}`}
          />
          {errors.ownerName && <p className="text-sm text-red-500 mt-1">{errors.ownerName.message}</p>}
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone" className="font-semibold">رقم الهاتف <span className="text-red-500">*</span></Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+249..."
              {...register("phone")}
              className={`mt-1.5 text-left md:text-right ${errors.phone ? "border-red-500" : ""}`}
            />
            {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <Label htmlFor="email" className="font-semibold">البريد الإلكتروني <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="ahmed@example.com"
              {...register("email")}
              className={`mt-1.5 text-left md:text-right ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
