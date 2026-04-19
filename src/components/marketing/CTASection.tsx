"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconSparkles, IconRocket, IconArrowLeft, IconBrandGoogle, IconCheck } from "@tabler/icons-react";

export function CTASection() {
  const customers = 5000;
  const merchants = 150;
  const satisfaction = 99;

  return (
    <section className="py-28 relative overflow-hidden bg-gradient-to-b from-zinc-50 to-white">
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50"
      />

      {/* Static Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-amber-200/40 to-orange-200/20 rounded-full blur-[80px]" />
      </div>

      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-emerald-200/30 to-teal-200/20 rounded-full blur-[80px]" />
      </div>

      {/* Sparkles */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute text-amber-400/60 pointer-events-none opacity-50"
          style={{
            left: `${20 + i * 15}%`,
            bottom: "20%",
          }}
        >
          <IconSparkles className="w-6 h-6" />
        </div>
      ))}

      <div className="container max-w-7xl mx-auto px-6 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200/50 mb-8 shadow-lg shadow-amber-100/50">
          <div>
            <IconRocket className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-sm text-amber-800 font-semibold">
            انضم لأكثر من {customers.toLocaleString()}+ عميل سعيد
          </span>
        </div>

        {/* Main Heading */}
        <h2 className="mx-auto max-w-4xl text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 mb-6 leading-tight">
          <span>جاهز لتبدأ رحلتك مع</span>
          <span className="block mt-2 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent bg-[length:200%_auto]">
            نوبيان؟
          </span>
        </h2>

        <p className="mx-auto max-w-2xl text-lg md:text-xl text-zinc-600 mb-12 leading-relaxed">
          انضم إلى آلاف العملاء والتجار الذين يثقون في نوبيان كوجهتهم الأولى للتسوق والبيع الرقمي في السودان.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/sign-in">
            <Button
              size="lg"
              className="group relative rounded-full h-16 px-10 text-lg bg-zinc-900 text-white hover:bg-zinc-800 min-w-[220px] font-bold shadow-2xl overflow-hidden"
            >
              <span className="flex items-center gap-2 relative z-10">
                إنشاء حساب مجاني
                <IconArrowLeft className="w-5 h-5" />
              </span>
            </Button>
          </Link>

          <Link href="/shop">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full h-16 px-10 text-lg border-2 border-zinc-300 text-zinc-900 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 min-w-[220px] font-medium"
            >
              تصفح المتجر
            </Button>
          </Link>

          <Link href="/affiliate/register">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full h-16 px-10 text-lg text-primary hover:bg-primary/10 border-2 border-primary/20 min-w-[220px] font-bold"
            >
              انضم كمسوق
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-16">
          {[
            { value: customers, suffix: "+", label: "عميل سعيد", icon: "👥" },
            { value: merchants, suffix: "+", label: "تاجر موثوق", icon: "🏪" },
            { value: satisfaction, suffix: "%", label: "رضا العملاء", icon: "⭐" },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl bg-white border border-zinc-100 shadow-lg shadow-zinc-100/50 group"
            >
              <span className="absolute -top-3 -right-3 text-2xl">
                {stat.icon}
              </span>
              <p className="text-3xl md:text-4xl font-black text-zinc-900 mb-1">
                {stat.value.toLocaleString()}{stat.suffix}
              </p>
              <p className="text-sm text-zinc-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-600 font-medium mb-12">
          {[
            "بدون رسوم تسجيل",
            "توصيل سريع لجميع الولايات",
            "عمولة على كل عمليه شراء عن طريقك",
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <IconCheck className="w-3 h-3 text-white" />
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* App Download Banner */}
        <div className="pt-12 border-t border-zinc-200">
          <p className="text-zinc-500 text-sm font-medium mb-6">حمّل التطبيق الآن</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://play.google.com/store/apps/details?id=dev.expo.nubian"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl group shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                <IconBrandGoogle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400 mb-0.5">حمّل من</p>
                <p className="text-white font-bold text-lg">Google Play</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
