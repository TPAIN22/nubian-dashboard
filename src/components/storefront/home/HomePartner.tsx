/**
 * Sell and earn.
 *
 * The homepage this replaces was, in effect, a merchant-acquisition landing
 * page wearing a shop's name: both hero buttons went to `/merchant/apply` and
 * `/affiliate/register`, and the page carried a full-width merchant pitch
 * illustrated with grey mock dashboard panels plus a block reading "10%" in
 * 60px type over a tinted rectangle.
 *
 * Those two funnels are real business and stay — moved below the catalogue,
 * compressed into one band, and stated plainly. A shopper reaches the
 * products first; a merchant still finds the door.
 *
 * The 10% figure is the platform default (`DEFAULT_COMMISSION_RATE`,
 * `marketer.model.js`), described here as a default rather than a guarantee,
 * because individual marketer rates are configurable per account.
 */

import { Section } from "../Section";
import { StoreButton } from "../StoreButton";

export function HomePartner() {
  return (
    <Section aria-labelledby="partner-heading" divided>
      <h2 id="partner-heading" className="sr-only">
        اعمل مع نوبيان
      </h2>

      <div className="grid gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
        <div className="max-w-md">
          <p className="sf-eyebrow mb-2.5">للتجار</p>
          <h3 className="sf-title text-sf-ink text-[1.75rem] md:text-[2rem]">
            افتح متجرك على نوبيان
          </h3>
          <p className="sf-body mt-4">
            أنشئ متجرك، أضف منتجاتك، وأدِر الطلبات والأسعار من لوحة تحكم واحدة.
            يبدأ الأمر بطلب انضمام تراجعه إدارة نوبيان.
          </p>
          <StoreButton href="/merchant/apply" className="mt-7">
            قدّم طلب انضمام
          </StoreButton>
        </div>

        <div className="border-sf-rule max-w-md border-t pt-12 md:border-s md:border-t-0 md:pt-0 md:ps-16 lg:ps-24">
          <p className="sf-eyebrow mb-2.5">للمسوّقين</p>
          <h3 className="sf-title text-sf-ink text-[1.75rem] md:text-[2rem]">
            اربح من كل طلب عبر رابطك
          </h3>
          <p className="sf-body mt-4">
            شارك منتجات نوبيان برابط إحالة خاص بك وتابع أرباحك أولاً بأول.
            العمولة الافتراضية 10% من قيمة الطلب.
          </p>
          <StoreButton href="/affiliate/register" variant="outline" className="mt-7">
            سجّل كمسوّق
          </StoreButton>
        </div>
      </div>
    </Section>
  );
}
