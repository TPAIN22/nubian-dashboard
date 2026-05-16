import React from "react"
import Link from "next/link"
import { BrandLogo } from "./BrandLogo"

const footerLinks = [
  {
    title: "المنصة",
    links: [
      { name: "كن تاجراً", href: "/merchant/apply" },
      { name: "الشحن العالمي", href: "/shipping" },
      { name: "مركز المساعدة", href: "/support" }
    ]
  },
  {
    title: "الشركة",
    links: [
      { name: "من نحن", href: "/about" },
      { name: "الوظائف", href: "/careers" },
      { name: "اتصل بنا", href: "/contact" },
      { name: "الشركاء", href: "/partners" }
    ]
  },
  {
    title: "قانوني",
    links: [
      { name: "سياسة الخصوصية", href: "/privacy-policy" },
      { name: "شروط الخدمة", href: "/terms-conditions" },
      { name: "سياسة الاستبدال", href: "/exchange-policy" }
    ]
  }
]

export function MinimalFooter() {
  return (
    <footer className="bg-background pt-24 pb-12 border-t border-border">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16 text-right">
          <div className="lg:col-span-2">
            <BrandLogo />
            <p className="mt-6 text-muted-foreground max-w-sm ml-auto leading-relaxed">
              سوق التجارة الإلكترونية الرائد في السودان. صُمم من أجل التقثقة والجودة والأمان.
            </p>
          </div>

          {footerLinks.map((column, idx) => (
            <div key={idx} className="flex flex-col gap-6">
              <h4 className="text-sm font-bold tracking-widest text-foreground uppercase">{column.title}</h4>
              <ul className="flex flex-col gap-3">
                {column.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-border flex flex-col md:flex-row-reverse justify-between items-center gap-6">
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} مختبرات نوبيان. جميع الحقوق محفوظة.
          </div>
          <div className="flex gap-8">
             <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">Twitter</span>
             </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
