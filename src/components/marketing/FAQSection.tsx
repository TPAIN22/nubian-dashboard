import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function FAQSection() {
  const faqs = [
    {
      question: "كيف يمكنني البدء في البيع على نوبيان؟",
      answer: "الأمر بسيط! قم بتسجيل حساب تاجر جديد، وأكمل بيانات متجرك، وسيقوم فريقنا بمراجعة طلبك وتفعيله في غضون 24 ساعة.",
    },
    {
      question: "ما هي عمولة نوبيان على المبيعات؟",
      answer: "نحن نتقاضى عمولة رمزية فقط على المبيعات الناجحة تتراوح بين 5% إلى 10% حسب فئة المنتج، ولا توجد رسوم تأسيس.",
    },
    {
      question: "كيف يتم تحويل أرباحي؟",
      answer: "يتم تحويل الأرباح أسبوعياً إلى حسابك البنكي أو عبر تطبيق بنكك فور تأكيد استلام العميل للطلب.",
    },
    {
      question: "هل توفرون خدمة التوصيل؟",
      answer: "نعم، لدينا شراكات مع أفضل شركات التوصيل في السودان لتغطية العاصمة والولايات بأسعار تنافسية.",
    },
    {
      question: "هل يمكنني بيع منتجات مستعملة؟",
      answer: "حالياً نركز على المنتجات الجديدة والأصلية لضمان جودة التجربة للعملاء.",
    },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">الأسئلة الشائعة</h2>
          <p className="text-muted-foreground text-lg">
            كل ما تحتاج معرفته عن منصة نوبيان.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border-b-zinc-100">
              <AccordionTrigger className="text-lg font-medium text-right hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
