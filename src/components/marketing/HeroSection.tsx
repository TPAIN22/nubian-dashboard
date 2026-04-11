"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconDeviceMobile, IconSparkles } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 pb-32">
      {/* Static Background Texture */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Decorative Gradient Orbs */}
      <div className="absolute top-0 right-1/4 pointer-events-none">
        <div className="w-[500px] h-[500px] bg-gradient-to-br from-amber-100/50 to-orange-100/30 rounded-full blur-[100px]" />
      </div>
      <div className="absolute bottom-0 left-1/4 pointer-events-none">
        <div className="w-[400px] h-[400px] bg-gradient-to-br from-blue-100/40 to-cyan-100/20 rounded-full blur-[80px]" />
      </div>

      {/* Static Sparkles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-amber-400/50 pointer-events-none opacity-50"
          style={{
            left: `${15 + i * 12}%`,
            bottom: "10%",
          }}
        >
          <IconSparkles className="w-5 h-5" />
        </div>
      ))}

      <div className="container max-w-7xl mx-auto px-6 relative z-10 text-center">
        <div>
          {/* Badge */}
          <div>
            <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 text-sm border-zinc-200 bg-white/50 backdrop-blur-sm text-zinc-600 shadow-lg">
              <span className="inline-block mr-1">✨</span>
              مرحباً بكم في نوبيان
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl md:text-7xl lg:text-8xl mb-8 leading-[1.1]">
            <span>تجربة تسوق</span>
            <span className="text-zinc-800 mx-2">
              استثنائية
            </span>
            <br />
            <span>في السودان</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed mb-10">
            منصة نوبيان تجمع بين أحدث صيحات الموضة، التقنية، والديكور المنزلي في مكان واحد.
            تسوق بثقة، وادفع بأمان، واستلم مشترياتك في أي مكان.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/shop">
              <Button size="lg" className="relative rounded-full h-14 px-8 text-lg bg-zinc-900 hover:bg-zinc-800 text-white min-w-[180px] overflow-hidden shadow-xl shadow-zinc-900/20">
                ابدأ التسوق الآن
                <IconArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/merchant/apply">
              <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg border-zinc-200 hover:bg-zinc-50 text-zinc-900 min-w-[180px]">
                سجل كتاجر
              </Button>
            </Link>
          </div>
        </div>

        {/* Product UI Mockup */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl shadow-zinc-200/50 ring-1 ring-zinc-950/5 lg:rounded-3xl lg:p-4">
            <div className="aspect-[16/9] overflow-hidden rounded-xl lg:rounded-2xl bg-zinc-50 border border-zinc-100 relative group flex flex-col">

              {/* Mock Browser Header */}
              <div className="h-8 border-b border-zinc-100 flex items-center px-4 gap-2 bg-white/50">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${['bg-red-400/80', 'bg-yellow-400/80', 'bg-green-400/80'][i]}`}
                  />
                ))}
                <div className="ml-4 h-5 w-64 bg-zinc-100 rounded-md" />
              </div>

              {/* Mock Dashboard Content */}
              <div className="flex-1 p-6 relative">
                <div className="flex gap-6 h-full">
                  {/* Sidebar */}
                  <div className="w-48 hidden md:flex flex-col gap-3 py-2">
                    <div className="h-8 w-32 bg-zinc-200 rounded-md mb-4"></div>
                    {[1, 0.75, 0.85].map((width, i) => (
                      <div
                        key={i}
                        className="h-4 bg-zinc-100 rounded-md opacity-30"
                        style={{ width: `${width * 100}%` }}
                      />
                    ))}
                  </div>

                  {/* Main Area */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center mb-8">
                      <div className="h-8 w-40 bg-zinc-900/10 rounded-lg"></div>
                      <div className="h-8 w-24 bg-zinc-900 rounded-full" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { emoji: "💰", bg: "bg-blue-50" },
                        { emoji: "📦", bg: "bg-purple-50" },
                        { emoji: "👥", bg: "bg-green-50" },
                      ].map((card, idx) => (
                        <div
                          key={idx}
                          className={`h-24 ${card.bg} border border-zinc-100 rounded-xl shadow-sm p-4 space-y-2`}
                        >
                          <div className="text-2xl">{card.emoji}</div>
                          <div className="w-16 h-4 bg-zinc-200/50 rounded"></div>
                        </div>
                      ))}
                    </div>

                    <div className="h-48 bg-white border border-zinc-100 rounded-xl shadow-sm mt-4" />
                  </div>
                </div>

                {/* Overlay CTA */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                  <Link href="/merchant/apply">
                    <Button size="lg" className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full p-2 md:p-4 shadow-2xl shadow-zinc-900/20 text-xs md:text-base font-semibold h-auto">
                      انضم للتجار وابدأ البيع
                      <IconArrowLeft className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Static badge decoration (Left) */}
          <div className="absolute -left-8 top-1/3 hidden lg:block z-20">
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl ring-1 ring-zinc-950/5 flex items-center gap-4 max-w-[200px]">
              <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <p className="font-bold text-zinc-900">مبيعات فورية</p>
                <p className="text-xs text-zinc-500">اربط منتجاتك وابدأ البيع</p>
              </div>
            </div>
          </div>

          {/* Static badge decoration (Right) */}
          <div className="absolute -right-8 top-1/2 hidden lg:block z-20">
            <Link href="https://play.google.com/store/apps/details?id=dev.expo.nubian" target="_blank">
              <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl ring-1 ring-zinc-950/5 flex items-center gap-4 cursor-pointer bg-white/80 backdrop-blur-md">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <IconDeviceMobile className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-zinc-900">حمل التطبيق الآن</p>
                  <p className="text-xs text-zinc-500">تجربة تسوق أسرع 🚀</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
