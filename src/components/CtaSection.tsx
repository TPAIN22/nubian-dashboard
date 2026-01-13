import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-accent/5" />

          <div className="relative z-10 text-center py-12 sm:py-14 md:py-16 px-5 sm:px-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-5 sm:mb-6 text-foreground leading-tight">
              جاهز تبيع على{" "}
              <span className="inline-block bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent mx-1">
                نُوبيان؟
              </span>
            </h2>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
              انضم إلى منصة التجارة الإلكترونية الرائدة في السودان. ابدأ بيع منتجاتك لعملاء جدد اليوم.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Link href="/merchant/apply" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="
                    relative w-full sm:w-auto
                    bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary
                    text-white border-0 shadow-2xl hover:shadow-primary/50
                    transition-all duration-300
                    font-bold rounded-xl overflow-hidden
                    px-6 py-5 text-base
                    sm:px-10 sm:py-7 sm:text-lg
                  "
                  aria-label="سجّل كتاجر - Register as Merchant"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    سجّل كتاجر
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-120%] hover:translate-x-[120%] transition-transform duration-700" />
                </Button>
              </Link>

              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="
                    w-full sm:w-auto
                    border-2 border-foreground/20 hover:border-primary/50 hover:bg-primary/5
                    transition-all duration-300
                    font-bold rounded-xl
                    px-6 py-5 text-base
                    sm:px-10 sm:py-7 sm:text-lg
                  "
                  aria-label="تواصل معنا - Contact Us"
                >
                  <span className="flex items-center justify-center gap-3">
                    <Mail className="w-5 h-5" />
                    تواصل معنا
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
