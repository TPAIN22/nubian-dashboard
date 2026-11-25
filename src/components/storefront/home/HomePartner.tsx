/**
 * Sell and earn — the two doors for people on the other side of the counter.
 *
 * Below the catalogue, so a shopper reaches products first and a merchant
 * still finds the way in. The 10% figure is the platform default
 * (`DEFAULT_COMMISSION_RATE`), described as a default because marketer rates
 * are configurable per account.
 */

import { Megaphone, Store } from "lucide-react";

import { Section } from "../Section";
import { StoreButton } from "../StoreButton";

const DOORS = [
  {
    icon: Store,
    eyebrow: "للتجار",
    title: "افتح متجرك على نوبيان",
    body: "أضف منتجاتك وأدِر الطلبات والأسعار من لوحة تحكم واحدة. يبدأ الأمر بطلب انضمام يراجعه فريق نوبيان.",
    label: "قدّم طلب انضمام",
    href: "/merchant/apply",
    variant: "primary",
  },
  {
    icon: Megaphone,
    eyebrow: "للمسوّقين",
    title: "اربح من كل طلب عبر رابطك",
    body: "شارك منتجات نوبيان برابط إحالة خاص بك وتابع أرباحك أولاً بأول. العمولة الافتراضية 10% من قيمة الطلب.",
    label: "سجّل كمسوّق",
    href: "/affiliate/register",
    variant: "outline",
  },
] as const;

export function HomePartner() {
  return (
    <Section aria-labelledby="partner-heading" space="tight" className="pb-16 md:pb-24">
      <h2 id="partner-heading" className="sr-only">
        اعمل مع نوبيان
      </h2>
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        {DOORS.map(({ icon: Icon, ...door }) => (
          <div key={door.href} className="sf-card flex flex-col p-7 md:p-9">
            <span className="bg-sf-tint text-sf-accent grid h-12 w-12 place-items-center rounded-xl">
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="sf-eyebrow mt-6">{door.eyebrow}</p>
            <h3 className="sf-title mt-1.5 text-[1.375rem] md:text-[1.5rem]">{door.title}</h3>
            <p className="sf-body mt-3 max-w-[48ch]">{door.body}</p>
            <StoreButton href={door.href} variant={door.variant} className="mt-7 w-fit">
              {door.label}
            </StoreButton>
          </div>
        ))}
      </div>
    </Section>
  );
}
