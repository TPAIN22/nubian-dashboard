import React from "react"
import { IconShield, IconBolt, IconGlobe, IconMessageCircle } from "@tabler/icons-react"

const features = [
  {
    title: "مدفوعات آمنة",
    description: "بروتوكولات أمان متعددة الطبقات لضمان حماية كل عملية شراء.",
    icon: IconShield,
  },
  {
    title: "إعداد فوري",
    description: "أنشئ متجرك في دقائق باستخدام لوحة تحكم التاجر البديهية.",
    icon: IconBolt,
  },
  {
    title: "توصيل لجميع أنحاء السودان",
    description: "شبكة لوجستية متكاملة تصل إلى كل ركن في البلاد بكفاءة.",
    icon: IconGlobe,
  },
  {
    title: "دعم على مدار الساعة",
    description: "مساعدة احترافية متى احتجت إليها للحفاظ على استمرارية عملك.",
    icon: IconMessageCircle,
  },
]

export function MinimalFeatures() {
  return (
    <section className="py-24 bg-white border-y border-zinc-100">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4 text-center">البنية التحتية الأساسية</h2>
          <p className="text-3xl md:text-4xl font-bold text-zinc-950">
            كل ما تحتاجه للتجارة <br className="hidden md:block" /> بسرعة الضوء.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col gap-5 text-right">
              <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-950">
                <feature.icon size={24} stroke={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-950 mb-2">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed text-sm md:text-base">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
