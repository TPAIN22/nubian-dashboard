import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconDeviceMobile } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 pb-32">
      {/* Background Texture */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      <div className="container max-w-7xl mx-auto px-6 relative z-10 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-backwards">
          <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 text-sm border-zinc-200 bg-white/50 backdrop-blur-sm text-zinc-600">
            ✨ مرحباً بكم في نوبيان
          </Badge>
          
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl md:text-7xl lg:text-8xl mb-8 leading-[1.1]">
            تجربة تسوق <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 to-zinc-500">استثنائية</span> <br/>
            في السودان
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed mb-10">
            منصة نوبيان تجمع بين أحدث صيحات الموضة، التقنية، والديكور المنزلي في مكان واحد. 
            تسوق بثقة، وادفع بأمان، واستلم مشترياتك في أي مكان.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg bg-zinc-900 hover:bg-zinc-800 text-white min-w-[180px]">
                ابدأ التسوق الآن
                <IconArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/merchant">
              <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg border-zinc-200 hover:bg-zinc-50 text-zinc-900 min-w-[180px]">
                سجل كتاجر
              </Button>
            </Link>
          </div>
        </div>

        {/* Product UI Mockup */}
        <div className="mt-20 relative mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-backwards">
          <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl shadow-zinc-200/50 ring-1 ring-zinc-950/5 lg:rounded-3xl lg:p-4">
             <div className="aspect-[16/9] overflow-hidden rounded-xl lg:rounded-2xl bg-zinc-50 border border-zinc-100 relative group flex flex-col">
                
                {/* Mock Browser Header */}
                <div className="h-8 border-b border-zinc-100 flex items-center px-4 gap-2 bg-white/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                  <div className="ml-4 h-5 w-64 bg-zinc-100 rounded-md"></div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="flex-1 p-6 relative">
                   <div className="flex gap-6 h-full">
                      {/* Sidebar */}
                      <div className="w-48 hidden md:flex flex-col gap-3 py-2">
                         <div className="h-8 w-32 bg-zinc-200 rounded-md mb-4"></div>
                         <div className="h-4 w-full bg-zinc-100 rounded-md"></div>
                         <div className="h-4 w-3/4 bg-zinc-100 rounded-md"></div>
                         <div className="h-4 w-5/6 bg-zinc-100 rounded-md"></div>
                      </div>
                      
                      {/* Main Area */}
                      <div className="flex-1 space-y-4">
                         <div className="flex justify-between items-center mb-8">
                            <div className="h-8 w-40 bg-zinc-900/10 rounded-lg"></div>
                            <div className="h-8 w-24 bg-zinc-900 rounded-full"></div>
                         </div>
                         
                         <div className="grid grid-cols-3 gap-4">
                            <div className="h-24 bg-white border border-zinc-100 rounded-xl shadow-sm p-4 space-y-2">
                               <div className="w-8 h-8 bg-blue-50 rounded-full mb-2 text-blue-500 flex items-center justify-center text-xs">$$</div>
                               <div className="w-16 h-4 bg-zinc-100 rounded"></div>
                            </div>
                            <div className="h-24 bg-white border border-zinc-100 rounded-xl shadow-sm p-4 space-y-2">
                               <div className="w-8 h-8 bg-purple-50 rounded-full mb-2 text-purple-500 flex items-center justify-center text-xs">📦</div>
                               <div className="w-16 h-4 bg-zinc-100 rounded"></div>
                            </div>
                            <div className="h-24 bg-white border border-zinc-100 rounded-xl shadow-sm p-4 space-y-2">
                               <div className="w-8 h-8 bg-green-50 rounded-full mb-2 text-green-500 flex items-center justify-center text-xs">👥</div>
                               <div className="w-16 h-4 bg-zinc-100 rounded"></div>
                            </div>
                         </div>

                         <div className="h-48 bg-white border border-zinc-100 rounded-xl shadow-sm mt-4"></div>
                      </div>
                   </div>

                   {/* Overlay Text */}
                   <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                     <Link href="/merchant/apply">
                       <Button size="lg" className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full p-2 md:p-4 shadow-2xl shadow-zinc-900/20 text-xs md:text-base font-semibold group hover:scale-105 transition-all duration-300 h-auto">
                          انضم للتجار وابدأ البيع
                          <IconArrowLeft className="mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:-translate-x-1 transition-transform" />
                       </Button>
                     </Link>
                   </div>
                </div>
             </div>
          </div>
          
          {/* Floating badge decoration (Left) */}
          <div className="absolute -left-8 top-1/3 hidden lg:block animate-bounce duration-[3000ms] z-20">
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl ring-1 ring-zinc-950/5 flex items-center gap-4 max-w-[200px]">
              <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center text-2xl">⚡</div>
              <div>
                 <p className="font-bold text-zinc-900">مبيعات فورية</p>
                 <p className="text-xs text-zinc-500">اربط منتجاتك وابدأ البيع خلال دقائق</p>
              </div>
            </div>
          </div>

          {/* Floating badge decoration (Right) */}
          <div className="absolute -right-8 top-1/2 hidden lg:block animate-bounce duration-[3000ms] delay-1000 z-20">
             <Link href="https://play.google.com/store/apps/details?id=dev.expo.nubian" target="_blank">
                <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl ring-1 ring-zinc-950/5 flex items-center gap-4 hover:scale-105 transition-transform cursor-pointer bg-white/80 backdrop-blur-md">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                     <IconDeviceMobile className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-zinc-900">حمل التطبيق الآن</p>
                     <p className="text-xs text-zinc-500">تجربة تسوق أسرع 🚀</p>
                  </div>
                </div>
             </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
