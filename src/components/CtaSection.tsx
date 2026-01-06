import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary to-secondary/90 rounded-3xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl" />
        <div className="relative z-10 text-center py-16 px-8 text-secondary-foreground">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ابــدا التســوق
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {" "}
              الــيـــوم
            </span>
            !
          </h2>
          <p className="text-xl text-secondary-foreground/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            انضم إلى ملايين العملاء الراضين في جميع أنحاء السودان. حمّل تطبيقنا للحصول على عروض حصرية، ودفع أسرع، وتوصيات شخصية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchant/apply">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                حمـــل التـــطبــيــق
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </Link>
            <Link href="/merchant/apply">
              <Button variant="outline" size="lg" className="border-2 border-secondary-foreground/30 text-secondary-foreground bg-card/20 hover:bg-card/30 hover:scale-105 transition-all duration-300">
                انضم الى اسـرة نـوبـيـان
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}