import Link from "next/link";
import Image from "next/image";
import { IconArrowLeft } from "@tabler/icons-react";

type Mode = "signin" | "signup";

interface AuthShellProps {
  mode: Mode;
  children: React.ReactNode;
}

const COPY: Record<Mode, {
  title: string;
  subtitle: string;
  switchLabel: string;
  switchHref: string;
  switchCta: string;
}> = {
  signin: {
    title: "مرحباً بعودتك",
    subtitle: "سجّل الدخول للمتابعة إلى حسابك.",
    switchLabel: "ليس لديك حساب؟",
    switchHref: "/sign-up",
    switchCta: "أنشئ حساباً",
  },
  signup: {
    title: "إنشاء حساب",
    subtitle: "ابدأ مع نوبيان في أقل من دقيقة.",
    switchLabel: "لديك حساب بالفعل؟",
    switchHref: "/sign-in",
    switchCta: "سجّل الدخول",
  },
};

/**
 * Editorial split-pane auth layout.
 *
 *  - Brand pane (start side, desktop only): flat foreground surface. Logo
 *    top-anchored, tagline bottom-anchored, vast empty space in between —
 *    the whitespace is the design.
 *  - Form pane (end side): plain background. Header, naked Clerk widget,
 *    switch link, footer. No card wrapper.
 *
 *  Mobile collapses to the form pane only with a minimal top-bar.
 */
export function AuthShell({ mode, children }: AuthShellProps) {
  const copy = COPY[mode];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground font-ibm-plex-arabic antialiased"
    >
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* ── Brand pane ─────────────────────────────────────────── */}
        {/* bg-secondary / text-secondary-foreground are theme-stable: both light
            and dark mode resolve them to brand green (#005b35) on white text.
            That keeps the brand pane recognisably "Nubian" regardless of theme. */}
        <aside className="relative hidden lg:flex flex-col bg-secondary text-secondary-foreground p-12 xl:p-16">
          {/* Wordmark — top start */}
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 self-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
          >
            <div className="relative h-7 w-7 overflow-hidden rounded-sm bg-white/10">
              <Image src="/logo.png" alt="" fill className="object-contain p-0.5" />
            </div>
            <span translate="no" className="text-base font-semibold tracking-tight">
              نوبيان
            </span>
          </Link>

          {/* Tagline — sits in the upper third, not pinned to the bottom */}
          <div className="mt-20 xl:mt-28 max-w-md space-y-3">
            <p className="text-3xl xl:text-4xl font-semibold leading-[1.3] tracking-tight text-balance">
              سوق متكامل
              <br />
              <span className="text-white/50">للعصر الحديث.</span>
            </p>
            <p className="text-sm text-white/60 leading-relaxed">
              منصة واحدة لكل ما يخص تجارتك — من الطلبات والشحن إلى التحليلات والمدفوعات.
            </p>
          </div>
        </aside>

        {/* ── Form pane ──────────────────────────────────────────── */}
        <main className="relative flex flex-col">
          {/* Top bar: mobile shows logo, all sizes show the back link on the end */}
          <div className="flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
            {/* Mobile-only wordmark (desktop shows it in the brand pane instead) */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="relative h-7 w-7 overflow-hidden rounded-sm">
                <Image src="/logo.png" alt="" fill className="object-contain" />
              </div>
              <span translate="no" className="text-base font-semibold tracking-tight">
                نوبيان
              </span>
            </Link>
            {/* Spacer to keep the back-link end-aligned on desktop */}
            <span className="hidden lg:block" aria-hidden="true" />

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              العودة للموقع
              <IconArrowLeft size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* Centered form column */}
          <div className="flex flex-1 items-start justify-center px-6 pb-16 pt-6 md:pt-12">
            <div className="w-full max-w-sm">
              <div className="mb-10">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
                  {copy.title}
                </h1>
                <p className="mt-2 text-[15px] text-muted-foreground">{copy.subtitle}</p>
              </div>

              {/* Clerk widget sits directly on the background — no card chrome */}
              {children}

              <p className="mt-8 text-sm text-muted-foreground">
                {copy.switchLabel}{" "}
                <Link
                  href={copy.switchHref}
                  className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {copy.switchCta}
                </Link>
              </p>
            </div>
          </div>

          {/* Footer: legal microcopy */}
          <div className="flex flex-col items-center justify-between gap-2 border-t border-border/50 px-6 py-5 text-xs text-muted-foreground md:flex-row md:px-10">
            <span translate="no">© {new Date().getFullYear()} نوبيان</span>
            <div className="flex items-center gap-5">
              <Link
                href="/terms-conditions"
                className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                الشروط
              </Link>
              <Link
                href="/privacy-policy"
                className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                الخصوصية
              </Link>
              <Link
                href="/contact"
                className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                الدعم
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
