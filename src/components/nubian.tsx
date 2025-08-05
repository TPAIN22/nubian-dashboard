"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingBag,
  Shield,
  Globe,
  Star,
  ArrowRight,
  Play,
  Heart,
  Award,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

// استيراد مكون Header الجديد
import Header from "@/components/Header";
import Image from "next/image";
export default function ModernNoubian() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: Event) => {
      setMousePosition({
        x: (e as MouseEvent).clientX,
        y: (e as MouseEvent).clientY,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Wide Product Range",
      desc: "تصفح آلاف المنتجات الأصلية من الأزياء إلى ديكور المنزل والإلكترونيات.",
      color: "from-amber-400 to-orange-500",
      accent: "#f0b745",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Shopping",
      desc: "طرق دفع آمنة مع حماية للمشتري وإرجاع جميع المشتريات.",
      color: "from-teal-400 to-cyan-500",
      accent: "#30a1a7",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Fast Delivery",
      desc: "شحن سريع في جميع أنحاء السودان مع تتبع جميع الطلبات في الوقت الحقيقي.",
      color: "from-purple-400 to-pink-500",
      accent: "#8b5cf6",
    },
  ];

  const stats = [
    {
      number: "50K+",
      label: "منــتــج مـــتـــوفـــر",
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    { number: "8+", label: "ولايـــات", icon: <Globe className="w-5 h-5" /> },
    {
      number: "4.8",
      label: "تقيـــمــات العـــمـــلاء",
      icon: <Star className="w-5 h-5" />,
    },
    {
      number: "24/7",
      label: "خـــــدمة العـــــمــلاء",
      icon: <Award className="w-5 h-5" />,
    },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden"
      dir="rtl"
    >
      {/* دمج مكون Header هنا */}
      <Header />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            top: "10%",
            left: "70%",
          }}
        />
        <div
          className="absolute w-80 h-80 bg-gradient-to-r from-teal-200/20 to-cyan-200/20 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
            bottom: "20%",
            left: "10%",
          }}
        />
      </div>

      <main className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col justify-center py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-right">
              {" "}
              {/* تم إضافة text-right هنا */}
              <div className="space-y-2">
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-0 hover:scale-105 transition-transform"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  الــســوق الســـودانـــي
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  منـــــصــــة
                  <br />
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  نـوبـيــــــان
                  </span>
                 
                </h1>
              </div>
              <p className="text-xl text-slate-600 max-w-xl leading-relaxed">
                بوابتك إلى منتجات فريدة. تسوق مباشرةً من بائعين موثوقين احصل على
                عروض وتخفيضات مع توصيل سريع وآمن.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                {" "}
                {/* تم إضافة justify-end هنا */}
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                >
                  اّب ســــــتـــــور
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />{" "}
                  {/* تم تغيير ml-2 إلى mr-2 */}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-teal-500 text-teal-600 hover:bg-teal-50 hover:scale-105 transition-all duration-300 group"
                >
                  <Play className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />{" "}
                  {/* تم تغيير mr-2 إلى ml-2 */}
                  قـــووقـــل بـــلاي
                </Button>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 text-right">
                {" "}
                {/* تم إضافة text-right هنا */}
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
                <Image
                  src="/nubi.png"
                  alt="Nubian" 
                  width={500}
                  height={500}
                  
                />  

              {/* Floating Elements */}
             
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="text-center mb-16">
            <Badge
              variant="secondary"
              className="mb-4 bg-teal-100 text-teal-800 border-0"
            >
              لـــمــاذا تــخــتــار نـوبـيــــــان
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              لـــمــاذا التـــســوق مــن 
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                {" "}
                نـوبـيــــــان
              </span>
              ?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              منصة التجارة الإلكترونية الرائدة في السودان تقدم منتجات عالية
              الجودة وأسعارًا تنافسية وخدمة استثنائية.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="relative">
                    <div
                      className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      {feature.icon}
                    </div>
                    <div
                      className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-xl"
                      style={{ background: feature.accent }}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      className="text-slate-700 hover:text-slate-900 group-hover:translate-x-1 transition-transform p-0"
                    >
                      المزيد <ArrowLeft className="w-4 h-4 mr-1" />{" "}
                      {/* تم تغيير ml-1 إلى mr-1 */}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
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
                انضم إلى ملايين العملاء الراضين في جميع أنحاء السودان. حمّل
                تطبيقنا للحصول على عروض حصرية، ودفع أسرع، وتوصيات شخصية.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  حمـــل التـــطبــيــق
                  <ArrowRight className="w-4 h-4 mr-2" />{" "}
                  {/* تم تغيير ml-2 إلى mr-2 */}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/30 text-black bg-white hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-300"
                >
                  انضم الى اسـرة نـوبـيـان
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
