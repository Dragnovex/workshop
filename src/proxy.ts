import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * في Next.js 16 صار اسم الاتفاقية `proxy` بدل `middleware`.
 *
 * حاليًا: توجيه اللغة فقط.
 * المرحلة الثانية (Auth.js): يُغلَّف هذا المعالج بحارس الجلسة —
 * يُقرأ الـ session أولًا، ثم يُمرَّر الطلب إلى معالج اللغة.
 * انظر src/lib/auth/README.md.
 */
export default createMiddleware(routing);

export const config = {
  // كل المسارات عدا الملفات الثابتة و/api و_next
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
