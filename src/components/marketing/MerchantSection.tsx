import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconCheck } from "@tabler/icons-react"

const benefits = [
  "أقل نسبة عمولة في السودان",
  "إعداد متجر احترافي مجاني",
  "خدمات بنكية وسحب نقدي متكاملة",
  "الوصول إلى ملايين المشترين المحتملين"
]

export function MerchantSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-2">
             <div className="relative aspect-square md:aspect-video lg:aspect-[4/5] bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                   <div className="flex justify-between items-start flex-row-reverse">
                      <div className="space-y-2 text-right">
                         <div className="w-32 h-8 bg-zinc-200 rounded" />
                         <div className="w-24 h-4 bg-zinc-100 rounded" />
                      </div>
                      <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                   </div>
                   
                   <div className="space-y-4">
                      <div className="flex gap-4">
                         <div className="w-1/3 h-24 bg-white border border-zinc-200 rounded-xl" />
                         <div className="w-1/3 h-24 bg-white border border-zinc-200 rounded-xl" />
                         <div className="w-1/3 h-24 bg-white border border-zinc-200 rounded-xl" />
                      </div>
                      <div className="w-full h-40 bg-zinc-950 rounded-xl flex items-center justify-center">
                         <span className="text-zinc-500 text-xs font-mono">Real-time Analytics API</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="order-1 lg:order-1 flex flex-col gap-8 text-right">
            <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">للتجار</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-zinc-950 leading-[1.1]">
               صُممت من أجل التجار، <br /> بواسطة التجار.
            </h3>
            <p className="text-lg text-zinc-500 leading-relaxed">
              نحن نفهم تحديات البيع في السودان. لهذا السبب قمنا ببناء الأدوات التي تحتاجها للنجاح، دون تعقيد.
            </p>
            
            <ul className="space-y-4">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-3 text-zinc-700 font-medium justify-end">
                  {benefit}
                  <div className="w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center text-white">
                    <IconCheck size={12} strokeWidth={3} />
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="pt-4 flex justify-end">
              <Link href="/merchant/apply">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-14 border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white transition-all">
                  انضم كتاجر الآن
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
