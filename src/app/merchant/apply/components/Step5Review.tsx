"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { MerchantRegistrationData } from "../schema";

export default function Step5Review() {
  const { getValues, formState: { errors } } = useFormContext<MerchantRegistrationData>();
  const data = getValues();

  const sections = [
    {
      title: "معلومات المتجر والاتصال",
      items: [
        { label: "اسم المتجر", value: data.storeName },
        { label: "اسم المالك", value: data.ownerName },
        { label: "رقم الهاتف", value: data.phone },
        { label: "البريد الإلكتروني", value: data.email },
      ]
    },
    {
      title: "تفاصيل العمل",
      items: [
        { label: "نوع التسجيل", value: data.merchantType === 'business' ? "عمل مسجل (شركة/مؤسسة)" : "فرد / عمل منزلي" },
        { label: "رقم الهوية", value: data.nationalId },
        { label: "رقم السجل التجاري", value: data.crNumber || "غير متوفر" },
      ]
    },
    {
      title: "المعلومات المالية",
      items: [
        { label: "الآيبان", value: data.iban },
      ]
    },
    {
      title: "إعدادات المتجر",
      items: [
        { label: "المدينة", value: data.city },
        { label: "الوصف", value: data.description },
        { label: "الفئات", value: data.categories?.join("، ") || "لم يتم تحديد فئات" },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1 text-gray-900 border-b pb-2">مراجعة طلبك</h3>
        <p className="text-sm text-gray-700 mb-6">يرجى مراجعة بياناتك والتأكد من صحتها قبل إرسال الطلب إلى فريقنا.</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-card text-card-foreground border rounded-xl overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b">
              <h4 className="text-sm font-bold">{section.title}</h4>
            </div>
            <div className="p-4 bg-transparent space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:justify-between border-b pb-2 last:border-0 last:pb-0">
                  <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                  <span className="text-sm sm:text-left text-right font-medium max-w-[70%] truncate">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logo and Samples Preview */}
        <div className="bg-card text-card-foreground border rounded-xl overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b">
            <h4 className="text-sm font-bold">الصور المرفوعة</h4>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">شعار المتجر</p>
              <img src={data.logoUrl} alt="Store Logo" className="w-16 h-16 rounded-lg border object-cover" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">عينات المنتجات ({data.productSamples?.length || 0})</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {data.productSamples?.map((url, i) => (
                  <div key={i} className="aspect-square rounded-md border overflow-hidden">
                    <img src={url} alt={`Sample ${i+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-border p-4 rounded-xl bg-card transition-colors">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...useFormContext<MerchantRegistrationData>().register("agreedToTerms")}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-relaxed">
              بالضغط على "إرسال الطلب"، أنت توافق على{' '}
              <a href="/terms" target="_blank" className="text-primary hover:underline font-bold">شروط الخدمة</a>
              {' '}و{' '}
              <a href="/privacy" target="_blank" className="text-primary hover:underline font-bold">سياسة الخصوصية</a>
              {' '}الخاصة بالمنصة.
            </span>
            <span className="text-xs text-muted-foreground">ستتم مراجعة طلبك يدوياً قبل الموافقة عليه.</span>
          </div>
        </label>
        {errors.agreedToTerms && (
          <p className="text-sm text-red-500 mt-2 pr-7">
            {errors.agreedToTerms.message}
          </p>
        )}
      </div>
    </div>
  );
}
