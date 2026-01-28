import Link from "next/link"
import Image from "next/image"
import { IconBrandFacebook, IconBrandInstagram, IconBrandTwitter, IconBrandLinkedin } from "@tabler/icons-react"

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-100 bg-white pt-16 pb-8">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12 mb-16">
          <div className="col-span-2 md:col-span-4 lg:col-span-2 space-y-6">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold tracking-tighter text-zinc-950">نوبيان</span>
            </Link>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-sm">
              منصة سودانية رائدة تجمع بين الأصالة والحداثة. نسعى لتمكين التجار وتقديم تجربة تسوق عالمية المستوى في السودان.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-300">
                <IconBrandTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-300">
                <IconBrandInstagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-300">
                <IconBrandFacebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-300">
                <IconBrandLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900 mb-6">المنتجات</h4>
            <ul className="space-y-4">
              <li><Link href="/features" className="text-zinc-500 hover:text-zinc-900 transition-colors">المميزات</Link></li>
              <li><Link href="/pricing" className="text-zinc-500 hover:text-zinc-900 transition-colors">الباقات</Link></li>
              <li><Link href="/merchants" className="text-zinc-500 hover:text-zinc-900 transition-colors">للتجار</Link></li>
              <li><Link href="/marketplace" className="text-zinc-500 hover:text-zinc-900 transition-colors">السوق</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900 mb-6">الشركة</h4>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-zinc-500 hover:text-zinc-900 transition-colors">من نحن</Link></li>
              <li><Link href="/careers" className="text-zinc-500 hover:text-zinc-900 transition-colors">وظائف</Link></li>
              <li><Link href="/blog" className="text-zinc-500 hover:text-zinc-900 transition-colors">المدونة</Link></li>
              <li><Link href="/contact" className="text-zinc-500 hover:text-zinc-900 transition-colors">اتصل بنا</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900 mb-6">الدعم</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-zinc-500 hover:text-zinc-900 transition-colors">الخصوصية</Link></li>
              <li><Link href="/terms" className="text-zinc-500 hover:text-zinc-900 transition-colors">الشروط والأحكام</Link></li>
              <li><Link href="/cookies" className="text-zinc-500 hover:text-zinc-900 transition-colors">الكوكيز</Link></li>
              <li><Link href="/help" className="text-zinc-500 hover:text-zinc-900 transition-colors">مركز المساعدة</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="font-semibold text-zinc-900 mb-6">حمل التطبيق</h4>
            <p className="text-sm text-zinc-500 mb-4">مسح سريع للتحميل</p>
            <div className="bg-zinc-50 p-2 rounded-xl inline-block border border-zinc-100">
               <Image 
                 src="/qr-code.svg" 
                 alt="QR Code" 
                 width={96} 
                 height={96} 
                 className="w-24 h-24"
               />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-400">© {new Date().getFullYear()} نوبيان. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-zinc-400">صنع بكل حب في السودان ❤️</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
