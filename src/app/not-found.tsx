import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold">الصفحة غير موجودة</h2>
      <p className="text-muted-foreground text-center max-w-md">
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <Link href="/">
        <Button>العودة إلى الصفحة الرئيسية</Button>
      </Link>
    </div>
  )
}


