import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative z-10 pt-28 pb-20">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/50 bg-background/90 backdrop-blur-xl shadow-lg p-8 md:p-12 text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">الصفحة غير موجودة</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button className="font-bold">العودة إلى الصفحة الرئيسية</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}



