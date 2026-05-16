import React from "react"

const stats = [
  { label: "تاجر نشط", value: "٢٥٠+" },
  { label: "منتج مدرج", value: "١٥,٠٠٠+" },
  { label: "طلب مكتمل", value: "٥٠,٠٠٠+" },
  { label: "تقييم العملاء", value: "٤.٩/٥" }
]

export function TrustSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="p-12 md:p-20 bg-foreground rounded-[2rem] text-background flex flex-col md:flex-row-reverse items-center justify-between gap-12 overflow-hidden relative">
          <div className="max-w-md relative z-10 text-right">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">بُنيت على الثقة.</h2>
            <p className="text-background/60 text-lg">
              لقد قضينا آلاف الساعات في إتقان بنيتنا التحتية حتى تتمكن من التركيز على ما يهم أكثر: عملك وعملاؤك.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-12 relative z-10 text-right">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="text-3xl md:text-4xl font-black text-background">{stat.value}</div>
                <div className="text-sm font-bold tracking-widest text-background/50 uppercase">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
             <div className="w-[150%] h-[150%] border-2 border-background rounded-full translate-x-1/2" />
          </div>
        </div>
      </div>
    </section>
  )
}
