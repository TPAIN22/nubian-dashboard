'use client';

import { useEffect } from 'react';
import logger from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    logger.error('Global Error Boundary', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h1 className="text-2xl font-bold">خطأ في التطبيق</h1>
            <p className="text-muted-foreground">
              حدث خطأ حرج. يرجى تحديث الصفحة أو الاتصال بالدعم.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              حاول مرة أخرى
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

