import React from "react"

const steps = [
  {
    number: "٠١",
    title: "أنشئ حسابك",
    description: "سجل كعميل أو تاجر في ثوانٍ باستخدام منصة المصادقة الآمنة الخاصة بنا."
  },
  {
    number: "٠٢",
    title: "أضف منتجاتك",
    description: "ارفع مخزونك بمساعدة أدوات التسعير والتدقيق، ودعم التصوير الاحترافي."
  },
  {
    number: "٠٣",
    title: "انطلق بتجارتك",
    description: "استقبل الطلبات، وأدر الشحنات، وتتبع نمو إيراداتك من خلال لوحة تحكم شاملة."
  }
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="mb-16 md:mb-24 text-right">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">كيف يعمل النظام</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col gap-6 relative text-right">
              <div className="text-6xl md:text-8xl font-black text-foreground/5 absolute -top-12 -right-4 -z-10 select-none">
                {step.number}
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
