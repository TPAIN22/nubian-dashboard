import { PricingSection } from "@/components/marketing/PricingSection"
import { FAQSection } from "@/components/marketing/FAQSection"
import { CTASection } from "@/components/marketing/CTASection"
import { PageHeader } from "@/components/dashboard/PageHeader" // Using shared header purely for SEO title structure if needed, but styling custom here

export const metadata = {
  title: "الباقات والأسعار | نوبيان",
  description: "اختر الباقة المناسبة لتجارتك. ابدأ مجاناً وادفع مع النمو.",
}

export default function PricingPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pt-24 pb-12 text-center container max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">استثمر في نجاح متجرك</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          خطط مرنة تناسب الجميع، من المتاجر المنزلية الصغيرة إلى العلامات التجارية الكبرى.
        </p>
      </div>
      
      <PricingSection />
      <FAQSection />
      <CTASection />
    </div>
  )
}
