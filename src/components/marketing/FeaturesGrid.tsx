"use client";

import { IconTruck, IconShieldCheck, IconHeadset, IconDeviceMobile, IconSparkles } from "@tabler/icons-react";

const features = [
  {
    title: "شحن سريع وآمن",
    description: "نغطي جميع الولايات مع شركاء لوجستيين موثوقين لضمان وصول طلبك في أسرع وقت.",
    icon: IconTruck,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    iconBg: "bg-blue-500",
  },
  {
    title: "دفع آمن 100%",
    description: "بوابات دفع مشفرة تدعم بنكك والتحويلات البنكية المباشرة، لراحة بالك.",
    icon: IconShieldCheck,
    gradient: "from-emerald-500 to-green-500",
    bgGradient: "from-emerald-50 to-green-50",
    iconBg: "bg-emerald-500",
  },
  {
    title: "دعم فني متميز",
    description: "فريقنا متواجد على مدار الساعة للإجابة على استفساراتك وحل أي مشكلة تواجهك.",
    icon: IconHeadset,
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-50 to-violet-50",
    iconBg: "bg-purple-500",
  },
  {
    title: "تجربة موبايل سلسة",
    description: "تطبيق ويب متطور يعمل بكفاءة على جميع الأجهزة والهواتف الذكية.",
    icon: IconDeviceMobile,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
    iconBg: "bg-amber-500",
  },
];

export function FeaturesGrid() {
  const customers = 5000;
  const merchants = 150;
  const support = 24;
  const satisfaction = 99;

  return (
    <section className="py-24 bg-zinc-50/50 relative overflow-hidden">
      {/* Static Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 -right-48 w-96 h-96 border border-zinc-200/30 rounded-full" />
        <div className="absolute -bottom-48 -left-48 w-96 h-96 border border-zinc-200/30 rounded-full" />

        {/* Static Sparkles */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute text-amber-400/40 opacity-50"
            style={{
              left: `${25 + i * 18}%`,
              bottom: "10%",
            }}
          >
            <IconSparkles className="w-5 h-5" />
          </div>
        ))}
      </div>

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto mb-6 rounded-full" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            لماذا تختار نوبيان؟
          </h2>
          <p className="text-muted-foreground text-lg">
            نقدم معايير جديدة للتجارة الإلكترونية في السودان، تركز على الجودة والموثوقية.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="h-full">
              <div className={`group relative rounded-2xl bg-gradient-to-br ${feature.bgGradient} p-8 border border-zinc-100 shadow-lg h-full`}>
                {/* Icon */}
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl ${feature.iconBg} text-white shadow-lg`}>
                  <feature.icon className="h-7 w-7" />
                </div>

                {/* Content */}
                <h3 className="mb-3 text-xl font-bold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative Corner */}
                <div className={`absolute bottom-4 left-4 w-12 h-12 rounded-full bg-gradient-to-br ${feature.gradient} opacity-20 blur-xl`} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 pt-12 border-t border-zinc-200/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: customers, suffix: "+", label: "عميل سعيد", emoji: "👥" },
              { value: merchants, suffix: "+", label: "تاجر موثوق", emoji: "🏪" },
              { value: support, suffix: "/7", label: "دعم متواصل", emoji: "🎧" },
              { value: satisfaction, suffix: "%", label: "رضا العملاء", emoji: "⭐" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="relative p-6 rounded-2xl bg-white border border-zinc-100 shadow-lg group cursor-default"
              >
                <span className="absolute -top-3 -right-3 text-2xl">
                  {stat.emoji}
                </span>
                <p className="text-3xl md:text-4xl font-black text-zinc-900">
                  {stat.value.toLocaleString()}{stat.suffix}
                </p>
                <p className="text-sm text-zinc-500 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
