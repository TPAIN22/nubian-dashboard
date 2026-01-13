"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const MERCHANT_STEPS = [
  {
    icon: <Store className="w-8 h-8" />,
    title: "سجّل متجرّك",
    description: "أنشئ حساب تاجر في دقائق. املأ معلومات عملك واحصل على الموافقة خلال 1-2 يوم عمل.",
    color: "from-primary to-primary/80",
  },
  {
    icon: <Package className="w-8 h-8" />,
    title: "أضف منتجاتك",
    description: "حمّل صور منتجاتك وأضف الوصف والأسعار. لوحة تحكم سهلة لإدارة المخزون.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: <ShoppingCart className="w-8 h-8" />,
    title: "ابدأ استقبال الطلبات",
    description: "استقبل الطلبات مباشرة من المشترين. إشعارات فورية لكل طلب جديد.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "إدارة المخزون والطلبات",
    description: "راقب المخزون، أدار الطلبات، وحدّث الحالة بسهولة. كل شيء في مكان واحد.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "تحليلات ومبيعات",
    description: "راقب أداء متجرك مع تقارير مفصلة. اعرف منتجاتك الأكثر مبيعاً وزد إيراداتك.",
    color: "from-orange-500 to-orange-600",
  },
];

export default function MerchantHighlight() {
  return (
    <section 
      id="merchants"
      className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-background to-background/50"
      aria-label="Merchant Highlight Section"
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
              aria-label="For Merchants Badge"
            >
              <Sparkles className="w-4 h-4 ml-2 animate-pulse" aria-hidden="true" />
              للتجار
            </Badge>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl  md:text-6xl lg:text-7xl font-black text-foreground">
            للـتجّار: افتح متجرك في
            <p className="block p-2 md:inline bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent mt-2 md:mt-0 md:mx-3 drop-shadow-sm">
              دقائق 
            </p>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            انضم إلى منصة نوبيان وابدأ بيع منتجاتك لعملاء جدد. أدوات قوية، دعم متواصل، ووصول لملايين المشترين.
          </p>
        </div>

        {/* Steps Grid */}
        <div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12"
          role="list"
          aria-label="Merchant Steps"
        >
          {MERCHANT_STEPS.map((step, index) => (
            <Card 
              key={`merchant-step-${index}`}
              className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-background via-background to-background/50 backdrop-blur-sm overflow-hidden"
              role="listitem"
              style={{
                animation: `fade-in-up 0.6s ease-out forwards ${0.1 + index * 0.1}s`,
                opacity: 0
              }}
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <CardContent className="relative p-8 md:p-10 text-center space-y-6">
                {/* Icon Container */}
                <div className="relative inline-block">
                  <div 
                    className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                  >
                    <div className="scale-125">
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Glow effect */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-2xl blur-2xl scale-150`}
                  />
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                  {step.description}
                </p>

                {/* Bottom decorative element */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-3/4 transition-all duration-500 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <Link href="/merchant/apply">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white border-0 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group font-bold px-10 py-8 text-xl rounded-xl overflow-hidden"
              aria-label="سجّل كتاجر الآن - Register as Merchant Now"
            >
              <span className="relative z-10 flex items-center gap-3">
                سجّل كتاجر الآن
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Button>
          </Link>
        </div>
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
