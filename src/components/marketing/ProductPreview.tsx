import React from "react"
import Link from "next/link"

const sampleProducts = [
  {
    name: "ساعة جلدية كلاسيكية",
    price: "١٢,٥٠٠ ج.س",
    category: "إكسسوارات",
    image: "/api/placeholder/400/500"
  },
  {
    name: "حقيبة قماشية قطنية",
    price: "٤,٢٠٠ ج.س",
    category: "نمط حياة",
    image: "/api/placeholder/400/500"
  },
  {
    name: "سماعات رأس سوداء مطفية",
    price: "٢٨,٠٠٠ ج.س",
    category: "إلكترونيات",
    image: "/api/placeholder/400/500"
  },
  {
    name: "مصباح مكتب معماري",
    price: "١٥,٨٠٠ ج.س",
    category: "ديكور منزلي",
    image: "/api/placeholder/400/500"
  }
]

export function ProductPreview() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 text-right">
          <div className="max-w-2xl">
            <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4">الأكثر مبيعاً</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-foreground">نتائج احترافية <br /> لذوقك الشخصي.</h3>
          </div>
          <Link href="/shop" className="text-foreground font-bold border-b-2 border-foreground pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors">
            عرض جميع المنتجات
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {sampleProducts.map((product, idx) => (
            <div key={idx} className="group cursor-pointer text-right">
              <div className="aspect-[4/5] bg-muted rounded-sm mb-6 overflow-hidden relative">
                 <div className="absolute inset-0 bg-foreground/10 animate-pulse group-hover:bg-foreground/15 transition-colors" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-card text-foreground px-4 py-2 text-xs font-bold tracking-widest uppercase shadow-xl">عرض سريع</span>
                 </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{product.category}</p>
                <h4 className="text-lg font-bold text-foreground">{product.name}</h4>
                <p className="text-muted-foreground font-medium">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
