import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-zinc-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
      </div>
      
      <div className="container max-w-7xl mx-auto px-6 text-center relative z-10">
        <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl mb-8">
          جاهز لتبدأ رحلتك مع نوبيان؟
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-zinc-300 mb-10">
          انضم إلى آلاف العملاء والتجار الذين يثقون في نوبيان كوجهتهم الأولى للتسوق والبيع الرقمي في السودان.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="rounded-full h-14 px-10 text-lg bg-white text-zinc-900 hover:bg-zinc-100 min-w-[200px]">
              إنشاء حساب جديد
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="rounded-full h-14 px-10 text-lg border-white/20 text-primary hover:bg-white/10 min-w-[200px]">
              تواصل معنا
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
