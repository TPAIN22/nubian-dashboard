import { IconTruck, IconShieldCheck, IconHeadset, IconDeviceMobile } from "@tabler/icons-react"

export function FeaturesGrid() {
  const features = [
    {
      title: "شحن سريع وآمن",
      description: "نغطي جميع الولايات مع شركاء لوجستيين موثوقين لضمان وصول طلبك في أسرع وقت.",
      icon: IconTruck,
    },
    {
      title: "دفع آمن 100%",
      description: "بوابات دفع مشفرة تدعم بنكك والتحويلات البنكية المباشرة، لراحة بالك.",
      icon: IconShieldCheck,
    },
    {
      title: "دعم فني متميز",
      description: "فريقنا متواجد على مدار الساعة للإجابة على استفساراتك وحل أي مشكلة تواجهك.",
      icon: IconHeadset,
    },
    {
      title: "تجربة موبايل سلسة",
      description: "تطبيق ويب متطور يعمل بكفاءة على جميع الأجهزة والهواتف الذكية.",
      icon: IconDeviceMobile,
    },
  ]

  return (
    <section className="py-24 bg-zinc-50/50">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">لماذا تختار نوبيان؟</h2>
          <p className="text-muted-foreground text-lg">
            نقدم معايير جديدة للتجارة الإلكترونية في السودان، تركز على الجودة والموثوقية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group rounded-2xl bg-white p-8 border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-50 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-300">
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
