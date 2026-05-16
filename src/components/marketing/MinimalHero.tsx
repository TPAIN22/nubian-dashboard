import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"

export function MinimalHero() {
  return (
    <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden bg-background">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16 md:mb-24">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-8 leading-[1.05]">
            سوق متكامل <br className="hidden md:block" />
            <span className="text-muted-foreground">للعصر الحديث.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
            المنصة المصممة للنمو. تواصل مع آلاف العملاء، وأدر طلباتك بسهولة، ونمِّ تجارتك مع نوبيان.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href="/merchant/apply" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 text-base font-medium transition-all group">
                ابدأ البيع
                <IconArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/affiliate/register" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full border-border text-foreground hover:bg-muted text-base font-medium transition-all bg-card shadow-sm">
                انضم كمسوق
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Image / Mockup */}
        <div className="relative mx-auto max-w-6xl">
          <div className="aspect-[16/9] md:aspect-[21/9] bg-muted rounded-2xl border border-border overflow-hidden shadow-2xl shadow-foreground/5">
            <div className="w-full h-full p-4 md:p-8 flex flex-col gap-6 opacity-60">
              <div className="flex items-center justify-between border-b border-border pb-6">
                <div className="flex gap-4">
                  <div className="w-24 h-6 bg-foreground/20 rounded" />
                  <div className="w-24 h-6 bg-foreground/10 rounded" />
                </div>
                <div className="w-10 h-10 bg-foreground/20 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-32 bg-card border border-border rounded-xl p-4 flex flex-col justify-end">
                    <div className="w-12 h-4 bg-foreground/10 rounded mb-2" />
                    <div className="w-20 h-8 bg-foreground/20 rounded" />
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-card border border-border rounded-xl p-6">
                <div className="w-full h-full bg-muted rounded-lg" />
              </div>
            </div>

            {/* Center indicator for interactivity */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-6 py-3 bg-card/40 backdrop-blur-3xl border border-border rounded-2xl shadow-2xl">
                <p className="text-foreground font-medium">لوحة تحكم جاهزة للاستخدام</p>
              </div>
            </div>
          </div>

          {/* Subtle accent circles */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-muted rounded-full blur-[100px] opacity-50 -z-10" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-muted rounded-full blur-[100px] opacity-50 -z-10" />
        </div>
      </div>
    </section>
  )
}
