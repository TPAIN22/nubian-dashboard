/**
 * What a shopper can rely on.
 *
 * Three statements, each one checkable against this codebase:
 *
 *   1. Merchant review — `merchantStatus` moves through
 *      pending → approved/rejected and `middleware.ts` gates selling on
 *      `approved`; the home feed only returns `status: 'approved'` stores.
 *   2. Prices in Sudanese pounds — the storefront sends `x-currency: SDG`
 *      and the backend's FX service converts from the USD base with a dated
 *      rate (`lib/pricing.engine.js`, `ExchangeRate`).
 *   3. Reachable support — the published address and number, which also back
 *      the Organization structured data and the contact page.
 *
 * What is gone: the band this replaces claimed "٢٥٠+ تاجر نشط",
 * "١٥,٠٠٠+ منتج مدرج", "٥٠,٠٠٠+ طلب مكتمل" and "٤.٩/٥ تقييم العملاء". None of
 * those numbers exist anywhere in the platform — the live catalogue holds 41
 * products and every store's rating is the backend's hardcoded 4.5 default
 * with zero reviews behind it.
 */

import { Section } from "../Section";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY } from "@/lib/storefront/routes";

const ITEMS = [
  {
    title: "متاجر معتمدة",
    body:"متاجر مختارة بعناية ومعتمدة من قبل نوبيان.",
  },
  {
    title: "عروض متنوعة",
    body: "اختر منتجًا من مجموعة كبيرة من المنتجات المتوفرة في نوبيان.",
  },
  {
    title: "دعم مباشر",
    body: "تواصل مع خدمة العملاء بالبريد الإلكتروني أو الهاتف.",
  },
] as const;

export function HomeAssurance() {
  return (
    <Section aria-labelledby="assurance-heading" divided space="tight">
      <h2 id="assurance-heading" className="sr-only">
        التسوّق على نوبيان
      </h2>

      <ul className="grid gap-10 md:grid-cols-3 md:gap-12">
        {ITEMS.map((item) => (
          <li key={item.title} className="border-primary border-t-2 pt-5">
            <h3 className="sf-kufi text-sf-ink text-lg font-medium">{item.title}</h3>
            <p className="sf-meta mt-2 max-w-xs leading-relaxed">{item.body}</p>
          </li>
        ))}
      </ul>

      <p className="sf-meta border-sf-rule mt-10 border-t pt-6">
        للاستفسارات:{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="sf-focus text-sf-ink hover:text-sf-accent underline underline-offset-4 transition-colors"
        >
          <bdi>{SUPPORT_EMAIL}</bdi>
        </a>{" "}
        ·{" "}
        <a
          href={`tel:${SUPPORT_PHONE}`}
          className="sf-focus text-sf-ink hover:text-sf-accent underline underline-offset-4 transition-colors"
        >
          <bdi>{SUPPORT_PHONE_DISPLAY}</bdi>
        </a>
      </p>
    </Section>
  );
}
