/**
 * The opening frame.
 *
 * A split composition rather than type laid over a full-bleed photograph:
 * one tall still — an amber bottle in hard afternoon sun — set beside the
 * statement on a sand ground sampled from the picture itself. The two halves
 * share one palette, so the frame reads as a single composed page, and the
 * photograph never has to be darkened under a scrim to keep the headline
 * legible.
 *
 * Why this image opens the page: it is a product. The first thing a visitor
 * sees should say "shop" before it says anything else, and perfume is the
 * department the live catalogue is deepest in. It is also the light the rest
 * of the page is built from — raking sun, long shadow, warm stone — which is
 * the same light the strongest merchant photography in the catalogue already
 * uses, so the handover from campaign to real products further down is a
 * continuation rather than a cut.
 *
 * It is not pinned and carries no scroll cue: the first scroll moves the page.
 * The shopping CTA is in the frame, and the sticky header above it has search
 * and department navigation, so nothing below has to be scrolled through to
 * reach the catalogue.
 *
 * The photograph is the LCP element and is the only eagerly loaded campaign
 * image on the page.
 */

import Link from "next/link";

import { StoryVisual } from "./StoryVisual";
import { StoreButton } from "../StoreButton";
import { routes } from "@/lib/storefront/routes";

export function StoryOpening() {
  return (
    <section
      aria-labelledby="story-opening-heading"
      className="sf-opening bg-sf-sand text-sf-ink relative isolate overflow-hidden"
    >
      <div className="sf-opening-grid mx-auto grid w-full max-w-[1440px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Copy — the start column, so it is on the right in RTL. */}
        <div className="order-2 flex flex-col justify-center px-5 pt-7 pb-12 md:px-10 md:pt-14 md:pb-20 lg:order-1 lg:px-14 lg:py-16 xl:px-20">
         

          {/* Broken by hand: left to `text-wrap: balance`, the column width
              stranded "في" at the end of the second line. */}
          <h1
            id="story-opening-heading"
            // Held a step under the display ceiling so each authored line fits
            // the copy column at every desktop width.
            className="sf-display max-lg:text-[clamp(2.1rem,1.2rem+4vw,3.25rem)] lg:text-[clamp(3rem,1rem+3.3vw,4.4rem)]"
          >
           نوبيـــــان
            <br />
            لكل النــــــاس
          </h1>

          <p className="text-sf-ink-soft mt-4 max-w-md text-base leading-relaxed md:mt-8 md:text-lg">
           كل ما تحتاجه في تطبيق واحد ابدأ الان منتظر شنو 
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4 md:mt-11">
            <StoreButton href={routes.shop()} size="lg">
              تسوّق الآن
            </StoreButton>
            <Link
              href="#departments"
              className="sf-focus text-sf-ink border-sf-ink/30 hover:border-sf-ink border-b pt-1 pb-1.5 text-sm font-medium transition-colors"
            >
              تصفّح الأقسام
            </Link>
          </div>
        </div>

        {/* The still. Full height of the frame on desktop; a tall crop above
            the copy on a phone, kept short enough that the headline is in
            the first screen — with the CTA, below a 130px phone header. */}
        <div className="sf-opening-media order-1 h-[38svh] min-h-[240px] md:h-[48svh] lg:order-2 lg:h-auto lg:min-h-[calc(100svh-var(--sf-header-h))]">
          <StoryVisual
            image="/story/amber-light.webp"
            alt="زجاجة عطر كهرمانية تحت ضوء شمس العصر"
            className="h-full w-full"
            imageClassName="object-[50%_42%]"
            sizes="(min-width: 1024px) 52vw, 100vw"
            priority
            quality={80}
            grade
          />
        </div>
      </div>
    </section>
  );
}
