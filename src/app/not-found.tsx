import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconHome, IconHelpCircle, IconLogin2 } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "404 — الصفحة غير موجودة | نوبيان",
  description:
    "الصفحة التي تبحث عنها غير موجودة أو تم نقلها. ارجع إلى الصفحة الرئيسية لمواصلة التسوق في نوبيان.",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-background text-foreground font-ibm-plex-arabic antialiased"
    >
      {/* Ambient brand glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-[120px]"
      />

      {/* Top brand bar */}
      <header className="relative z-10 border-b border-border/40">
        <div className="container mx-auto max-w-7xl flex items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 rounded-sm overflow-hidden transition-transform group-hover:scale-105">
              <Image src="/logo.png" alt="Nubian Logo" fill className="object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              نوبيان <span className="text-muted-foreground font-light ml-1">nubian</span>
            </span>
          </Link>
          <Link
            href="/contact"
            className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            تواصل مع الدعم
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex items-center justify-center px-6 py-20 md:py-28">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              خطأ 404 · Page not found
            </span>

            <h1 className="mt-8 text-[7rem] md:text-[12rem] font-black leading-none tracking-tighter bg-gradient-to-b from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent select-none">
              404
            </h1>

            <h2 className="mt-2 text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              يبدو أنك ضللت الطريق
            </h2>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-muted-foreground" lang="en" dir="ltr">
              This page wandered off the map
            </p>

            <p className="mx-auto mt-6 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
              الصفحة التي تبحث عنها غير موجودة، أو تم نقلها، أو ربما لم تكن موجودة من الأساس.
              لا بأس — يمكنك العودة إلى الصفحة الرئيسية والمتابعة من حيث توقفت.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-7 rounded-full bg-foreground text-background hover:bg-foreground/90 text-base font-medium transition-all group"
                >
                  العودة للرئيسية
                  <IconArrowLeft size={18} className="mr-2 transition-transform group-hover:-translate-x-1" />
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-7 rounded-full border-border bg-card shadow-sm text-base font-medium"
                >
                  تواصل مع الدعم
                </Button>
              </Link>
            </div>

            {/* Quick destinations */}
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              <QuickLink
                href="/"
                icon={<IconHome size={18} />}
                label="الرئيسية"
                hint="ابدأ من جديد"
              />
              <QuickLink
                href="/sign-in"
                icon={<IconLogin2 size={18} />}
                label="تسجيل الدخول"
                hint="إلى حسابك"
              />
              <QuickLink
                href="/contact"
                icon={<IconHelpCircle size={18} />}
                label="المساعدة"
                hint="نحن هنا للدعم"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/40">
        <div className="container mx-auto max-w-7xl px-6 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} نوبيان · السوق العصري للسودان
        </div>
      </footer>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-right backdrop-blur transition-all hover:border-primary/50 hover:bg-card hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-primary">{icon}</span>
          {label}
        </span>
        <IconArrowLeft
          size={14}
          className="text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-foreground"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}
