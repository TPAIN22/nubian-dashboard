"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, 
  Truck, 
  Shield,
  Sparkles,
  ArrowRight
} from "lucide-react";

const SHOPPER_FEATURES = [
  {
    icon: <ShoppingBag className="w-8 h-8" />,
    title: "منتجات متنوعة",
    description: "تصفح آلاف المنتجات الأصلية من الأزياء إلى ديكور المنزل والإلكترونيات. كل شيء في مكان واحد.",
    color: "from-primary to-primary/80",
  },
  {
    icon: <Truck className="w-8 h-8" />,
    title: "توصيل سريع",
    description: "شحن سريع في جميع أنحاء السودان مع تتبع جميع الطلبات في الوقت الحقيقي. توصيل آمن وموثوق.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "دفع آمن",
    description: "طرق دفع آمنة مع حماية للمشتري وإرجاع جميع المشتريات. تسوق بثقة تامة.",
    color: "from-blue-500 to-blue-600",
  },
];

export default function ShopperHighlight() {
  return (
    <section 
      id="shoppers"
      className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-background/50 to-background"
      aria-label="Shopper Highlight Section"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20 space-y-6 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-block">
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-accent/10 to-primary/10 text-accent border-0 hover:scale-105 transition-all duration-300 px-6 py-2 text-sm font-bold shadow-lg backdrop-blur-sm"
              aria-label="For Shoppers Badge"
            >
              <Sparkles className="w-4 h-4 ml-2 animate-pulse" aria-hidden="true" />
              للمشترين
            </Badge>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight">
            للمشترين: اكتشف منتجات
            <p className="block md:inline bg-gradient-to-r from-accent via-accent/90 to-primary bg-clip-text text-transparent mt-2 md:mt-0 md:mx-3 drop-shadow-sm">
              أصيلة
            </p>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            تسوق من آلاف المنتجات الأصلية من تجار موثوقين. جودة عالية، أسعار تنافسية، وتوصيل سريع.
          </p>
        </div>

        {/* Features Grid */}
        <div 
          className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12"
          role="list"
          aria-label="Shopper Features"
        >
          {SHOPPER_FEATURES.map((feature, index) => (
            <Card 
              key={`shopper-feature-${index}`}
              className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-background via-background to-background/50 backdrop-blur-sm overflow-hidden"
              role="listitem"
              style={{
                animation: `fade-in-up 0.6s ease-out forwards ${0.1 + index * 0.1}s`,
                opacity: 0
              }}
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <CardContent className="relative p-8 md:p-10 text-center space-y-6">
                {/* Icon Container */}
                <div className="relative inline-block">
                  <div 
                    className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                  >
                    <div className="scale-125">
                      {feature.icon}
                    </div>
                  </div>
                  
                  {/* Glow effect */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-2xl blur-2xl scale-150`}
                  />
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                  {feature.description}
                </p>

                {/* Bottom decorative element */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent group-hover:w-3/4 transition-all duration-500 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Button and QR Code */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-muted-foreground text-sm font-medium mb-2">امسح الكود لتحميل التطبيق</p>
              <a
                href="https://play.google.com/store/apps/details?id=dev.expo.nubian"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border hover:border-accent/50 transition-all duration-300 hover:scale-105 shadow-lg"
                aria-label="QR Code - حمّل تطبيق نوبيان من Google Play"
              >
                <Image
                  src="/qr-code.svg"
                  alt="QR Code - حمّل تطبيق نوبيان"
                  width={180}
                  height={180}
                  className="w-[180px] h-[180px]"
                />
              </a>
            </div>

            {/* Download Button */}
            <div className="flex flex-col items-center gap-3">
              <a 
                href="https://play.google.com/store/apps/details?id=dev.expo.nubian"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-accent/50 hover:border-accent hover:bg-accent/5 transition-all duration-300 hover:scale-105 group font-bold px-10 py-8 text-xl rounded-xl"
                  aria-label="حمّل التطبيق من Google Play - Download App from Google Play"
                >
                  <span className="flex items-center gap-3">
                    حمّل التطبيق من Google Play
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </a>
            </div>
          </div>
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
