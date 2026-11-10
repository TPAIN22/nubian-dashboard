/**
 * The closing frame — the last thing on the page before the footer.
 *
 * The same afternoon light the page opened in, now with nothing in it but a
 * palm's shadow on a plaster wall. After a shelf of products, the frame is
 * deliberately empty: it is the pause before the one thing left to do, which
 * is to order — and ordering happens in the Android app, so that is what the
 * frame asks for.
 *
 * It replaces two sections that each tried to be the ending: a full-bleed of
 * the Meroë pyramids captioned "نوبيان." (heritage imagery standing in for a
 * brand, and a daylight-blue grade unrelated to every other frame), followed
 * three sections later by a separate black app band whose phone render sat
 * on an orange diamond. The page asked for the app twice and ended twice.
 *
 * The type sits on a flat ground sampled from the graded plaster (#C1A47C),
 * never on the photograph, so it needs no scrim at any width. Ink on that
 * ground is 7.8:1.
 */

import { StoryVisual } from "./StoryVisual";
import { StoreButton, StoreButtonExternal } from "../StoreButton";
import { routes, PLAY_STORE_URL } from "@/lib/storefront/routes";

export function StoryClosing() {
  return (
    <section
      aria-labelledby="story-closing-heading"
      className="sf-closing bg-sf-plaster text-sf-ink relative isolate overflow-hidden"
    >
      {/* The still sits on the far side of the frame and fades into a ground
          sampled from its own plaster, so the type always lands on clear
          wall. On a phone it is a band across the top, fading downward; from
          `lg` it is the left 64%, fading toward the copy. Physical `left`
          is deliberate: the photograph is mirrored so its fronds fall on
          that side regardless of reading direction. */}
      <div className="sf-closing-media sf-closing-fade absolute inset-x-0 top-0 -z-10 h-[58%] lg:inset-y-0 lg:right-auto lg:left-0 lg:h-full lg:w-[64%] [&_img]:-scale-x-100">
        <StoryVisual
          image="/story/palm-plaster.jpg"
          alt=""
          // Transparent while loading, so the plaster ground shows through
          // the mask instead of the image well's lighter placeholder.
          className="h-full w-full bg-transparent"
          sizes="(min-width: 1024px) 64vw, 100vw"
          objectPosition="50% 24%"
          quality={78}
          grade
        />
      </div>

      <div className="mx-auto flex min-h-[92svh] w-full max-w-[1320px] flex-col justify-end px-5 pt-16 pb-14 md:px-8 lg:min-h-[78svh] lg:items-start lg:justify-center lg:px-12 lg:py-24">
        <div className="max-w-xl">
          <p className="sf-eyebrow text-sf-ink mb-5">تطبيق نوبيان</p>

          <h2 id="story-closing-heading" className="sf-display">
            اطلب من هاتفك.
          </h2>

          <p className="text-sf-ink mt-6 max-w-md text-[1.0625rem] leading-relaxed md:text-lg">
            إتمام الطلب والدفع ومتابعة الشحنة تتم من تطبيق نوبيان على أندرويد.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4 md:mt-11">
            <StoreButtonExternal href={PLAY_STORE_URL} size="lg">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                <path d="M3.6 2.2a1 1 0 0 1 1.05.08l12.1 8.1a1 1 0 0 1 0 1.66l-12.1 8.1A1 1 0 0 1 3 19.3V3.08a1 1 0 0 1 .6-.88Z" />
              </svg>
              حمّل من Google Play
            </StoreButtonExternal>
            <StoreButton
              href={routes.shop()}
              variant="outline"
              size="lg"
              className="border-sf-ink/40 hover:border-sf-ink bg-transparent hover:bg-transparent"
            >
              تابع التسوّق هنا
            </StoreButton>
          </div>
        </div>
      </div>
    </section>
  );
}
