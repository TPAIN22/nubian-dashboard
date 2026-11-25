/**
 * Homepage hero.
 *
 * One rounded panel on a soft emerald tint: the statement, two actions and
 * three plain facts on one side, a single campaign still on the other. No
 * scroll-linked motion; the panel enters once on load (`data-enter`, see
 * globals.css) and simply appears under reduced motion.
 *
 * The department count is computed from the live taxonomy, never typed in.
 * The photograph is the LCP element and the only eagerly loaded image.
 */

import { BadgeCheck, Banknote, LayoutGrid } from "lucide-react";

import { StoreImage } from "../StoreImage";
import { StoreButton } from "../StoreButton";
import { Container } from "../Section";
import { routes } from "@/lib/storefront/routes";

/** Arabic counted-noun agreement: 3–10 take the plural, 11+ the singular. */
function counted(n: number, plural: string, singular: string) {
  return n >= 3 && n <= 10 ? `${n} ${plural}` : `${n} ${singular}`;
}

export function HomeHero({ departmentCount }: { departmentCount: number }) {
  const facts = [
    { icon: BadgeCheck, label: "متاجر معتمدة من نوبيان" },
    { icon: Banknote, label: "توصيل سريع" },
  ].filter(Boolean) as { icon: typeof BadgeCheck; label: string }[];

  return (
    <section aria-labelledby="hero-heading" data-enter className="pt-4 md:pt-6">
      <Container>
        <div className="bg-sf-tint grid overflow-hidden rounded-[2rem] lg:grid-cols-2">
          <div className="order-2 flex flex-col justify-center px-6 py-10 sm:px-10 md:py-14 lg:order-1 lg:px-14 lg:py-16 xl:px-16">
            <p className="sf-enter-1 bg-background/70 text-sf-accent inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold">
              <span className="bg-sf-accent h-1.5 w-1.5 rounded-full" aria-hidden="true" />
             كل اللي يعجبك
            </p>

            <h1 id="hero-heading" className="sf-display sf-enter-1 mt-5 max-w-[16ch]">
              تسوّق من أفضل البراند السودانية في مكان واحد
            </h1>

            <p className="sf-subtitle sf-enter-2 mt-5 max-w-[42ch]">
              عطور وأزياء وأحذية وإكسسوارات من متاجر            </p>

            <div className="sf-enter-3 mt-8 flex flex-wrap items-center gap-3">
              <StoreButton href={routes.shop()} size="lg" className="max-sm:flex-1">
                تسوّق الآن
              </StoreButton>
              <StoreButton href="#departments" variant="outline" size="lg" className="max-sm:flex-1">
                تصفّح الأقسام
              </StoreButton>
            </div>

            <ul className="sf-enter-4 mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {facts.map(({ icon: Icon, label }) => (
                <li key={label} className="text-sf-ink flex items-center gap-2 text-sm font-medium">
                  <Icon aria-hidden="true" className="text-sf-accent h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="sf-enter-media order-1 p-3 lg:order-2 lg:p-4">
            <StoreImage
              src="/story/amber-light.webp"
              alt="زجاجة عطر كهرمانية تحت ضوء الشمس"
              className="h-[260px] w-full rounded-[1.5rem] sm:h-[340px] lg:h-full lg:min-h-[520px]"
              objectPosition="50% 42%"
              sizes="(min-width: 1024px) 45vw, 100vw"
              priority
              quality={80}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
