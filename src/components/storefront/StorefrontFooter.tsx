/**
 * Storefront footer.
 *
 * Every link here resolves. The footer it replaces advertised `/shipping`,
 * `/support`, `/careers` and `/partners` — four routes that do not exist in
 * this app and returned the 404 page — plus a social link whose `href` was
 * `"#"` and whose only content was an `sr-only` label, so it rendered as an
 * invisible, unfocusable target.
 *
 * Shopping columns are generated from the live taxonomy for the same reason
 * the header's are: a department that is removed from the catalogue should
 * disappear from the footer without anyone remembering to edit it.
 */

import Link from "next/link";

import { StorefrontLogo } from "./StorefrontLogo";
import { Container } from "./Section";
import { getCategories } from "@/lib/storefront/api";
import { visibleCategories } from "./CategoryTile";
import {
  routes,
  PLAY_STORE_URL,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_DISPLAY,
} from "@/lib/storefront/routes";

/** `inline-block py-1.5` gives each footer link a 31px target, not a 19px one. */
const LINK =
  "sf-focus text-muted-foreground hover:text-sf-ink inline-block py-1.5 text-sm transition-colors";

const COMPANY_LINKS = [
  { label: "من نحن", href: "/about" },
  { label: "بِع على نوبيان", href: "/merchant/apply" },
  { label: "برنامج المسوقين", href: "/affiliate/register" },
  { label: "الباقات والأسعار", href: "/pricing" },
  { label: "تواصل معنا", href: "/contact" },
];

const POLICY_LINKS = [
  { label: "سياسة الاستبدال", href: "/exchange-policy" },
  { label: "سياسة الخصوصية", href: "/privacy-policy" },
  { label: "الشروط والأحكام", href: "/terms-conditions" },
];

/** Inline marks rather than an icon package: three glyphs, one visual weight. */
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Facebook: (
    <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.87.24-1.46 1.49-1.46H16.7V4.46A20 20 0 0 0 14.4 4.34c-2.3 0-3.9 1.4-3.9 3.98V10.5H8v3h2.5V21z" />
  ),
  Instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.75" />
      <circle cx="16.9" cy="7.1" r="1" />
    </>
  ),
  X: <path d="M4 4l16 16M20 4L4 20" />,
};

export async function StorefrontFooter() {
  const categories = visibleCategories(await getCategories(), 6);

  return (
    <footer className="border-sf-rule bg-background border-t">
      <Container>
        <div className="grid gap-12 py-16 md:grid-cols-12 md:gap-8 md:py-20">
          {/* Brand column */}
          <div className="md:col-span-4 lg:col-span-5">
            <StorefrontLogo />
            <p className="sf-body mt-5 max-w-sm text-[0.9375rem]">
              سوق إلكتروني سوداني يجمع تجاراً موثوقين في مكان واحد — من الأزياء
              والعطور إلى الإلكترونيات والمستلزمات اليومية.
            </p>

            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-focus border-sf-rule-strong text-sf-ink hover:border-sf-ink mt-7 inline-flex h-11 items-center gap-2.5 rounded-[3px] border px-5 text-sm font-medium transition-colors"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                <path d="M3.6 2.2a1 1 0 0 1 1.05.08l12.1 8.1a1 1 0 0 1 0 1.66l-12.1 8.1A1 1 0 0 1 3 19.3V3.08a1 1 0 0 1 .6-.88Z" />
              </svg>
              حمّل التطبيق على Google Play
            </a>

            <ul className="mt-7 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`نوبيان على ${social.name}`}
                    className="sf-focus border-sf-rule text-muted-foreground hover:border-sf-ink hover:text-sf-ink inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill={social.name === "Facebook" ? "currentColor" : "none"}
                      stroke={social.name === "Facebook" ? "none" : "currentColor"}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    >
                      {SOCIAL_ICONS[social.name]}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop column — hidden entirely if the taxonomy is unreachable. */}
          {categories.length > 0 && (
            <nav aria-labelledby="footer-shop" className="md:col-span-3 lg:col-span-2">
              <h2 id="footer-shop" className="text-sf-ink mb-5 text-sm font-semibold">
                تسوّق
              </h2>
              <ul className="space-y-1">
                <li>
                  <Link href={routes.shop()} className={LINK}>
                    كل المنتجات
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={routes.category(category.id)} className={LINK}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav aria-labelledby="footer-company" className="md:col-span-3 lg:col-span-2">
            <h2 id="footer-company" className="text-sf-ink mb-5 text-sm font-semibold">
              نوبيان
            </h2>
            <ul className="space-y-1">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2 lg:col-span-3">
            <h2 className="text-sf-ink mb-5 text-sm font-semibold">المساعدة</h2>
            <ul className="space-y-1">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>
                  <bdi>{SUPPORT_EMAIL}</bdi>
                </a>
              </li>
              <li>
                <a href={`tel:${SUPPORT_PHONE}`} className={LINK}>
                  <bdi>{SUPPORT_PHONE_DISPLAY}</bdi>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-sf-rule flex flex-col-reverse items-center justify-between gap-5 border-t py-7 sm:flex-row">
          <p className="sf-meta">
            © {new Date().getFullYear()} نوبيان. جميع الحقوق محفوظة.
          </p>
        </div>
      </Container>
    </footer>
  );
}
