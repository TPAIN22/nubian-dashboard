import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconHome, IconInfoCircle, IconMail, IconReceipt } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "404 — الصفحة غير موجودة | نوبيان",
  description:
    "الصفحة التي تبحث عنها غير موجودة أو تم نقلها. تصفّح نوبيان للعودة إلى التسوق.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient brand glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-primary/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]"
      />

      <div className="container relative mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            خطأ 404 · Page not found
          </span>

          <h1 className="mt-8 text-[6rem] md:text-[10rem] font-black leading-none tracking-tighter bg-gradient-to-b from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent select-none">
            404
          </h1>

          <h2 className="mt-2 text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            هذه الصفحة ليست هنا
          </h2>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-muted-foreground" lang="en" dir="ltr">
            We can&apos;t find what you&apos;re looking for
          </p>

          <p className="mx-auto mt-6 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
            ربما تم نقل الصفحة أو حُذفت، أو أن الرابط الذي اتبعته غير صحيح.
            ارجع إلى الصفحة الرئيسية أو استكشف الأقسام أدناه.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-7 rounded-full bg-foreground text-background hover:bg-foreground/90 text-base font-medium transition-all group"
              >
                العودة للرئيسية
                <IconArrowLeft
                  size={18}
                  className="mr-2 transition-transform group-hover:-translate-x-1"
                />
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 px-7 rounded-full border-border bg-card shadow-sm text-base font-medium"
              >
                تواصل معنا
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick destinations */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          <QuickLink href="/" icon={<IconHome size={18} />} label="الرئيسية" />
          <QuickLink href="/about" icon={<IconInfoCircle size={18} />} label="من نحن" />
          <QuickLink href="/pricing" icon={<IconReceipt size={18} />} label="الأسعار" />
          <QuickLink href="/contact" icon={<IconMail size={18} />} label="اتصل بنا" />
        </div>
      </div>
    </section>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur transition-all hover:border-primary/50 hover:bg-card hover:shadow-sm"
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <IconArrowLeft
        size={14}
        className="text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-foreground"
      />
    </Link>
  );
}
