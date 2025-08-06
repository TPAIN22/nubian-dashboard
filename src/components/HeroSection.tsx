import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Play } from "lucide-react";
import Image from "next/image";
import { Stat } from "./data"; // استيراد الـ type

// تعريف الـ props باستخدام TypeScript
interface HeroSectionProps {
  stats: Stat[];
}

// استخدام الـ props في المكون
export default function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="min-h-screen flex flex-col justify-center py-20">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 text-right">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-0 hover:scale-105 transition-transform">
              <Sparkles className="w-3 h-3 mr-1" />
              الــســوق الســـودانـــي
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              منـــــصــــة
              <br />
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                نـوبـيــــــان
              </span>
              <br />
              للتســـق الرقـــمــــي
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-xl leading-relaxed">
            بوابتك إلى منتجات فريدة. تسوق مباشرةً من بائعين موثوقين احصل على عروض وتخفيضات مع توصيل سريع وآمن.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              اّب ســــــتـــــور
              <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="border-2 border-teal-500 text-teal-600 hover:bg-teal-50 hover:scale-105 transition-all duration-300 group">
              <Play className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
              قـــووقـــل بـــلاي
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 text-right">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group cursor-pointer">
                <div className="flex items-center justify-center mb-2 text-teal-600 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {stat.number}
                </div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <Image src="/nubi.png" alt="Nubian" width={500} height={500} />
        </div>
      </div>
    </section>
  );
}