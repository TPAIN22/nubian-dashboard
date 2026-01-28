import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconCheck, IconX } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"

export function PricingSection() {
  const plans = [
    {
      name: "باقة البداية",
      price: "مجاناً",
      description: "للأفراد والشركات الناشئة لتجربة المنصة.",
      features: [
        { name: "متجر إلكتروني متكامل", included: true },
        { name: "إدارة 50 منتج", included: true },
        { name: "دعم فني عبر البريد", included: true },
        { name: "تقارير مبيعات أساسية", included: true },
        { name: "نطاق خاص (Domain)", included: false },
        { name: "أدوات تسويق متقدمة", included: false },
      ],
      cta: "ابدأ مجاناً",
      href: "/sign-up?plan=free",
      variant: "outline",
    },
    {
      name: "باقة النمو",
      price: "15,000",
      currency: "ج.س / شهرياً",
      description: "للتجار الجادين في توسيع نطاق مبيعاتهم.",
      popular: true,
      features: [
        { name: "كل مميزات البداية", included: true },
        { name: "منتجات غير محدودة", included: true },
        { name: "دعم فني أولوي (WhatsApp)", included: true },
        { name: "تقارير مبيعات متقدمة", included: true },
        { name: "تخصيص واجهة المتجر", included: true },
        { name: "ربط مع فيسبوك بيكسل", included: true },
      ],
      cta: "اشترك الآن",
      href: "/sign-up?plan=growth",
      variant: "default",
    },
    {
      name: "للشركات",
      price: "تواصل معنا",
      description: "حلول مخصصة للعلامات التجارية الكبرى.",
      features: [
        { name: "كل مميزات النمو", included: true },
        { name: "مدير حساب خاص", included: true },
        { name: "تطوير خصائص حسب الطلب", included: true },
        { name: "API Integration", included: true },
        { name: "دعم فني 24/7", included: true },
        { name: "تدريب فريق العمل", included: true },
      ],
      cta: "تواصل للمبيعات",
      href: "/contact",
      variant: "outline",
    },
  ]

  return (
    <section className="py-24 bg-zinc-50/50" id="pricing">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-sm">خطط الأسعار</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">اختر الباقة المناسبة لطموحك</h2>
          <p className="text-muted-foreground text-lg">
            لا توجد مصاريف خفية. يمكنك الإلغاء في أي وقت.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition-all duration-300 hover:shadow-md ${plan.popular ? 'bg-white border-zinc-900 ring-1 ring-zinc-900 scale-105 z-10' : 'bg-white border-zinc-200 hover:-translate-y-1'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-4 py-1">الأكثر طلباً</Badge>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  {plan.currency && <span className="text-sm text-muted-foreground">{plan.currency}</span>}
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
              </div>

              <div className="flex-1 mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <IconCheck className="h-5 w-5 text-zinc-900 shrink-0" />
                      ) : (
                        <IconX className="h-5 w-5 text-zinc-300 shrink-0" />
                      )}
                      <span className={feature.included ? 'text-zinc-700' : 'text-zinc-400'}>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href={plan.href} className="w-full">
                <Button 
                  video-variant={plan.variant as any} 
                  className={`w-full rounded-full h-12 text-base ${plan.popular ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-900'}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
