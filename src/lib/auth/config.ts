/**
 * إعداد المصادقة.
 *
 * الخطة الأصلية في README كانت Auth.js. تحوّلنا إلى **Supabase Auth** لأن
 * قاعدة البيانات صارت Supabase، وهذا يعطي طبقة لا يعطيها Auth.js وحده:
 * **RLS** — الصلاحية مفروضة داخل قاعدة البيانات نفسها، فحتى من يخاطب REST API
 * مباشرةً بمفتاح anon (وهو علني بالتصميم) لا يقرأ ما ليس له.
 */

/**
 * هل المصادقة مفعّلة؟
 *
 * **تُقرأ على الخادم فقط** (proxy، Server Components، Server Actions).
 * `DATA_SOURCE` بلا بادئة `NEXT_PUBLIC_` عمدًا: لا داعي لتسريب إعدادات
 * التشغيل إلى المتصفح، والعميل لا يحتاجها — نموذج الدخول يستدعي Server Action
 * والخادم يقرّر. متغيّر واحد لقرار واحد، بلا نسخة عامة تنحرف عنه.
 *
 * مربوطة بمصدر البيانات عمدًا: بيانات البذرة المحلية ليس لها مستخدمون،
 * فتفعيل الحارس عليها يقفل التطبيق على الجميع بلا طريقة دخول ممكنة.
 *
 * ⚠️ لا تنشر التطبيق وهو في وضع البذرة: يعني نظامًا مفتوحًا بلا حماية.
 */
export function isAuthEnabled(): boolean {
  return process.env.DATA_SOURCE?.trim().toLowerCase() === "supabase";
}

/** المسارات التي تُفتح بلا جلسة — شاشات المصادقة نفسها فقط. */
export const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
] as const;

/** هل هذا المسار عام؟ يُستدعى من proxy.ts بمسار يحمل بادئة اللغة. */
export function isPublicPath(pathname: string): boolean {
  // /ar/login → /login
  const withoutLocale = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  return PUBLIC_PATHS.some(
    (path) => withoutLocale === path || withoutLocale.startsWith(`${path}/`),
  );
}
