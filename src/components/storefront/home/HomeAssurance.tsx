/**
 * Why shop on Nubian — a quiet four-up strip.
 *
 * Every statement is checkable against the platform:
 *   - approved stores: `merchantStatus` gates selling; the feed returns
 *     `status: 'approved'` stores only
 *   - SDG prices: the storefront sends `x-currency: SDG` and the backend
 *     converts with a dated FX rate
 *   - ordering in the app: checkout lives in the Android app
 *   - support: the published email and phone
 * No invented counts, ratings or delivery promises.
 */

import { BadgeCheck, Banknote, Headset, Smartphone } from "lucide-react";

import { Section } from "../Section";

const ITEMS = [
  { icon: BadgeCheck, title: "متاجر معتمدة", body: "كل متجر يراجعه فريق نوبيان قبل أن يبدأ البيع." },
  { icon: Banknote, title: " توصيل سريع", body: "نوصلك وين ما كنت في السودان" },
  { icon: Smartphone, title: "اطلب من التطبيق", body: "أتمم الطلب وتابع شحنتك من تطبيق نوبيان." },
  { icon: Headset, title: "دعم مباشر", body: "فريق خدمة العملاء متاح بالبريد والهاتف." },
] as const;

export function HomeAssurance() {
  return (
    <Section aria-labelledby="assurance-heading" space="tight">
      <h2 id="assurance-heading" className="sr-only">
        لماذا نوبيان
      </h2>
      <ul className="border-sf-rule grid gap-px overflow-hidden rounded-2xl border bg-[var(--sf-rule)] sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="bg-card flex items-start gap-4 p-5 md:p-6">
            <span className="bg-sf-tint text-sf-accent grid h-11 w-11 shrink-0 place-items-center rounded-xl">
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="sf-heading text-[0.9375rem]">{title}</h3>
              <p className="sf-meta mt-1 leading-relaxed">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
