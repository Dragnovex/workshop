"use client";

import { useEffect } from "react";

/**
 * حدّ الخطأ الجذري — نسخة مخصصة بسيطة.
 * (النسخة الداخلية لـ Next.js تصطدم بخلل workStore أثناء البناء.)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground antialiased">
        <div className="max-w-md space-y-2">
          <p className="font-mono text-sm text-muted-foreground">500</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            حدث خطأ غير متوقّع
          </h1>
          <p className="text-sm text-muted-foreground">
            تعذّر عرض هذه الصفحة. حاول مرة أخرى.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
