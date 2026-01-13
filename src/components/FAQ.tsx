"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown,
  Sparkles,
  HelpCircle
} from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "كيف أسجّل كتاجر؟",
    answer: "سجّل كتاجر بسهولة من خلال زيارة صفحة التسجيل. املأ نموذج الطلب بالمعلومات المطلوبة (اسم العمل، البريد الإلكتروني، الهاتف، الوصف). سيقوم فريقنا بمراجعة طلبك خلال 1-2 يوم عمل وإرسال إشعار بالموافقة.",
    link: "/merchant/apply",
    linkText: "سجّل الآن",
  },
  {
    question: "هل في عمولة؟",
    answer: "نعم، نوبيان تطبق عمولة على المبيعات. العمولة شفافة ومذكورة بوضوح في اتفاقية التاجر. يمكنك الاطلاع على تفاصيل العمولة بعد التسجيل.",
    link: null,
    linkText: null,
  },
  {
    question: "كيف يتم استلام الأرباح؟",
    answer: "بعد بيع منتجك، يتم تحويل الأرباح إلى حسابك بعد خصم العمولة. يمكنك سحب الأرباح من لوحة التحكم الخاصة بك. نقدم طرق دفع متعددة وآمنة.",
    link: null,
    linkText: null,
  },
  {
    question: "هل في مراجعة للمنتجات؟",
    answer: "نعم، جميع المنتجات تخضع لمراجعة من قبل فريقنا قبل النشر للتأكد من الجودة والامتثال للسياسات. هذا يضمن تجربة تسوق موثوقة للعملاء.",
    link: null,
    linkText: null,
  },
  {
    question: "كيف الشحن؟",
    answer: "نوبيان توفر حلول شحن متكاملة. يمكنك استخدام خدمات الشحن الخاصة بنا أو إدارة الشحن بنفسك. نقدم تتبع للطلبات وإشعارات للمشترين.",
    link: null,
    linkText: null,
  },
  {
    question: "هل يمكنني إدارة المخزون؟",
    answer: "نعم، لوحة التحكم الخاصة بك تتيح لك إدارة المخزون بسهولة. أضف منتجات، حدّث الكميات، واحذف المنتجات غير المتوفرة. كل شيء في مكان واحد.",
    link: null,
    linkText: null,
  },
  {
    question: "كيف أتابع مبيعاتي؟",
    answer: "لوحة التحكم تحتوي على تقارير مفصلة عن مبيعاتك. يمكنك رؤية عدد الطلبات، الإيرادات، المنتجات الأكثر مبيعاً، وأكثر. كل البيانات محدثة في الوقت الحقيقي.",
    link: null,
    linkText: null,
  },
  {
    question: "هل في دعم فني للتجار؟",
    answer: "نعم، نقدم دعم فني متواصل للتجار. يمكنك التواصل معنا عبر البريد الإلكتروني أو من خلال لوحة التحكم. فريقنا جاهز لمساعدتك في أي وقت.",
    link: "/contact",
    linkText: "اتصل بنا",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section 
      id="faq"
      className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-background/50 to-background"
      aria-label="FAQ Section"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20 space-y-6 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-block">
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-0 hover:scale-105 transition-all duration-300 px-6 py-2 text-sm font-bold shadow-lg backdrop-blur-sm"
              aria-label="FAQ Badge"
            >
              <HelpCircle className="w-4 h-4 ml-2 animate-pulse" aria-hidden="true" />
              الأسئلة الشائعة
            </Badge>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight">
            الأسئلة
            <span className="block md:inline bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent mt-2 md:mt-0 md:mx-3 drop-shadow-sm">
              الشائعة
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            إجابات على الأسئلة الأكثر شيوعاً من التجار والمشترين.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4" role="list" aria-label="FAQ Items">
          {FAQ_ITEMS.map((item, index) => (
            <Card 
              key={`faq-${index}`}
              className="group relative border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background via-background to-background/50 backdrop-blur-sm overflow-hidden"
              role="listitem"
            >
              <CardContent className="p-0">
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full text-right p-6 md:p-8 flex items-center justify-between gap-4 hover:bg-accent/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <h3 className="text-lg md:text-xl font-bold text-foreground flex-1">
                    {item.question}
                  </h3>
                  <ChevronDown 
                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                
                {openIndex === index && (
                  <div 
                    id={`faq-answer-${index}`}
                    className="px-6 md:px-8 pb-6 md:pb-8 pt-0 animate-fade-in"
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                  >
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
                      {item.answer}
                    </p>
                    {item.link && (
                      <Link 
                        href={item.link}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
                        onClick={(e) => {
                          if (item.link?.startsWith('#')) {
                            e.preventDefault();
                            const element = document.querySelector(item.link);
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        {item.linkText}
                        <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <p className="text-lg text-muted-foreground mb-4">
            لم تجد إجابة لسؤالك؟
          </p>
          <Link href="/contact">
            <button className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-bold text-lg transition-colors duration-200">
              تواصل معنا
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </Link>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
