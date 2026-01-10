import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">المنتج غير موجود</p>
      <Link href="/business/products">
        <Button variant="default" className="gap-2">
          <ArrowRight className="h-4 w-4 rotate-180" />
          العودة إلى قائمة المنتجات
        </Button>
      </Link>
    </div>
  );
}
