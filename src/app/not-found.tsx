import Link from "next/link";

import "./globals.css";

/**
 * 404 خارج نطاق أي لغة (مسار لا يحمل بادئة لغة صالحة).
 * يبني <html> بنفسه لأن التخطيط الجذري يمرّر فقط.
 */
export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground antialiased">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary font-mono text-xs font-medium text-primary-foreground">
          ن
        </span>
        <div className="max-w-md space-y-2">
          <p className="font-mono text-sm text-muted-foreground">404</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            الصفحة غير موجودة
          </h1>
        </div>
        <Link
          href="/ar"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          العودة للوحة التحكم
        </Link>
      </body>
    </html>
  );
}
