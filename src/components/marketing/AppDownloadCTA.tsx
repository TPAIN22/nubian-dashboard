import React from "react"
import { IconBrandGooglePlay, IconDeviceMobile } from "@tabler/icons-react"

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=dev.expo.nubian"

export function AppDownloadCTA() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 px-8 py-16 md:px-16 md:py-24">
          <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <IconDeviceMobile size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-zinc-300">تطبيق نوبيان للهواتف</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.05]">
              تسوّق بسهولة مع نوبيان <br className="hidden md:block" />
            </h2>

            <p className="text-lg md:text-xl text-zinc-400 max-w-xl mb-12 leading-relaxed">
              حمّل التطبيق الآن وتمتع بتجربة تسوق أسرع وأسهل، واحصل على احدث العروض والطلبات.
            </p>

            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 h-16 px-10 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 transition-all font-medium shadow-2xl shadow-black/30"
            >
              <IconBrandGooglePlay size={24} />
              <div className="text-right leading-tight">
                <div className="text-[11px] text-zinc-500">حمّل من</div>
                <div className="text-base font-bold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
