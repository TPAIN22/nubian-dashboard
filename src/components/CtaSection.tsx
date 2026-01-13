import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-accent/5 rounded-3xl" />
          <div className="relative z-10 text-center py-16 px-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground">
              جاهز تبيع على
              <p className="block md:inline bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent mt-2 md:mt-0 md:mx-3">
                نُوبيان؟
              </p>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              انضم إلى منصة التجارة الإلكترونية الرائدة في السودان. ابدأ بيع منتجاتك لعملاء جدد اليوم.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/merchant/apply">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white border-0 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group font-bold px-10 py-8 text-xl rounded-xl overflow-hidden"
                  aria-label="سجّل كتاجر - Register as Merchant"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    سجّل كتاجر
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 font-bold px-10 py-8 text-xl rounded-xl"
                  aria-label="تواصل معنا - Contact Us"
                >
                  <span className="flex items-center gap-3">
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