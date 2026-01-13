"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Store, 
  Package, 
  ShoppingCart,
  ShoppingBag,
  Search,
  CreditCard,
  Sparkles,
  CheckCircle2
} from "lucide-react";

const MERCHANT_STEPS = [
  {
    step: "1",
    icon: <Store className="w-6 h-6" />,
    title: "سجّل كتاجر",
    description: "املأ نموذج التسجيل واحصل على الموافقة خلال 1-2 يوم عمل.",
  },
  {
    step: "2",
    icon: <Package className="w-6 h-6" />,
    title: "أضف منتجاتك",
    description: "حمّل منتجاتك مع الصور والأسعار والوصف. إدارة سهلة للمخزون.",
  },
  {
    step: "3",
    icon: <ShoppingCart className="w-6 h-6" />,
    title: "ابدأ البيع",
    description: "استقبل الطلبات وأدار مبيعاتك من لوحة التحكم الخاصة بك.",
  },
];

const SHOPPER_STEPS = [
  {
    step: "1",
    icon: <Search className="w-6 h-6" />,
    title: "تصفح المنتجات",
    description: "استعرض آلاف المنتجات الأصلية من مختلف الفئات والتجار.",
  },
  {
    step: "2",
    icon: <ShoppingBag className="w-6 h-6" />,
    title: "أضف للسلة واشتري",
    description: "اختر منتجاتك وأضفها للسلة. عملية شراء سريعة وآمنة.",
  },
  {
    step: "3",
    icon: <CreditCard className="w-6 h-6" />,
    title: "استلم طلبك",
    description: "تتبع طلبك وتلقى إشعارات التوصيل. توصيل سريع وآمن.",
  },
];

export default function HowItWorks() {
  return (
    <section 
      className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-background to-background/50"
      aria-label="How It Works Section"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20 space-y-6 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-block">
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-0 hover:scale-105 transition-all duration-300 px-6 py-2 text-sm font-bold shadow-lg backdrop-blur-sm"
              aria-label="How It Works Badge"
            >
              <Sparkles className="w-4 h-4 ml-2 animate-pulse" aria-hidden="true" />
              كيف يعمل
            </Badge>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight">
            كيف
            <p className="block md:inline bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent mt-2 md:mt-0 md:mx-3 drop-shadow-sm">
              يعمل نوبيان؟
            </p>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            خطوات بسيطة للبدء. سواء كنت تاجراً أو مشترياً، نوبيان يجعل العملية سهلة وسريعة.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="merchant" className="w-full" dir="rtl">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12 h-14 bg-muted/50">
            <TabsTrigger 
              value="merchant" 
              className="text-base md:text-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
              aria-label="أنا تاجر - I am a Merchant"
            >
              أنا تاجر
            </TabsTrigger>
            <TabsTrigger 
              value="shopper" 
              className="text-base md:text-lg font-bold data-[state=active]:bg-accent data-[state=active]:text-white"
              aria-label="أنا مشتري - I am a Shopper"
            >
              أنا مشتري
            </TabsTrigger>
          </TabsList>

          {/* Merchant Steps */}
          <TabsContent value="merchant" className="mt-8">
            <div 
              className="grid md:grid-cols-3 gap-6 md:gap-8"
              role="list"
              aria-label="Merchant Steps"
            >
              {MERCHANT_STEPS.map((step, index) => (
                <Card 
                  key={`merchant-how-${index}`}
                  className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-background via-background to-background/50 backdrop-blur-sm overflow-hidden"
                  role="listitem"
                  style={{
                    animation: `fade-in-up 0.6s ease-out forwards ${0.1 + index * 0.1}s`,
                    opacity: 0
                  }}
                >
                  <CardContent className="relative p-8 md:p-10 text-center space-y-6">
                    {/* Step Number */}
                    <div className="absolute top-4 right-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {step.step}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="relative inline-block mt-4">
                      <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-all duration-500">
                        {step.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-muted-foreground leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Shopper Steps */}
          <TabsContent value="shopper" className="mt-8">
            <div 
              className="grid md:grid-cols-3 gap-6 md:gap-8"
              role="list"
              aria-label="Shopper Steps"
            >
              {SHOPPER_STEPS.map((step, index) => (
                <Card 
                  key={`shopper-how-${index}`}
                  className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-background via-background to-background/50 backdrop-blur-sm overflow-hidden"
                  role="listitem"
                  style={{
                    animation: `fade-in-up 0.6s ease-out forwards ${0.1 + index * 0.1}s`,
                    opacity: 0
                  }}
                >
                  <CardContent className="relative p-8 md:p-10 text-center space-y-6">
                    {/* Step Number */}
                    <div className="absolute top-4 right-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {step.step}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="relative inline-block mt-4">
                      <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-all duration-500">
                        {step.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-muted-foreground leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
