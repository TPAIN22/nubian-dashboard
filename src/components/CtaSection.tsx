import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl" />
        <div className="relative z-10 text-center py-16 px-8 text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ابــدا التســوق
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {" "}
              الــيـــوم
            </span>
            !
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            انضم إلى ملايين العملاء الراضين في جميع أنحاء السودان. حمّل تطبيقنا للحصول على عروض حصرية، ودفع أسرع، وتوصيات شخصية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              حمـــل التـــطبــيــق
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
            <Button variant="outline" size="lg" className="border-2 border-white/30 text-black bg-white hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-300">
              انضم الى اسـرة نـوبـيـان
            </Button>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}