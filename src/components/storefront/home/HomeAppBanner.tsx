/**
 * Get the app.
 *
 * Checkout, payment and shipment tracking happen in the Android app, so this
 * is the page's one dark band: a rounded deep-emerald card with the Play
 * Store button. The large wordmark is decorative and `aria-hidden`.
 */

import { StoreButtonExternal } from "../StoreButton";
import { Section } from "../Section";
import { PLAY_STORE_URL } from "@/lib/storefront/routes";

export function HomeAppBanner() {
  return (
    <Section aria-labelledby="app-heading" space="tight">
      <div className="bg-sf-inverse text-sf-inverse-foreground relative isolate overflow-hidden rounded-[2rem] px-7 py-12 sm:px-12 md:py-16 lg:px-16">
        {/* Soft emerald glow, decorative. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -z-10 h-72 w-72 rounded-full bg-[#1f8a5b]/40 blur-[90px] end-[-4rem]"
        />
        <p
          aria-hidden="true"
          className="sf-heading text-sf-inverse-foreground/[0.06] pointer-events-none absolute -bottom-8 -z-10 text-[clamp(6rem,18vw,13rem)] leading-none font-bold select-none end-6"
        >
          نوبيان
        </p>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="max-w-xl">
            <h2 id="app-heading" className="sf-title !text-sf-inverse-foreground">
              اطلب من هاتفك بسهولة
            </h2>
            <p className="text-sf-inverse-muted mt-4 text-[1rem] leading-relaxed md:text-[1.0625rem]">
              إتمام الطلب والدفع ومتابعة الشحنة، كلها من تطبيق نوبيان على
              أندرويد.
            </p>
          </div>
          <StoreButtonExternal href={PLAY_STORE_URL} variant="inverse" size="lg" className="max-sm:w-full">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
              <path d="M3.6 2.2a1 1 0 0 1 1.05.08l12.1 8.1a1 1 0 0 1 0 1.66l-12.1 8.1A1 1 0 0 1 3 19.3V3.08a1 1 0 0 1 .6-.88Z" />
            </svg>
            حمّل التطبيق من Google Play
          </StoreButtonExternal>
        </div>
      </div>
    </Section>
  );
}
