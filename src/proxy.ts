import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthEnabled, isPublicPath } from "@/lib/auth/config";
import { routing } from "@/i18n/routing";

/**
 * في Next.js 16 صار اسم الاتفاقية `proxy` بدل `middleware`.
 *
 * ترتيب العمل: الجلسة أولًا ثم اللغة — لأن إعادة التوجيه إلى صفحة الدخول
 * يجب أن تحمل بادئة اللغة الصحيحة، وهي لا تُعرف قبل تشغيل معالج اللغة.
 * لذلك نشغّل معالج اللغة أولًا للحصول على الاستجابة، ثم نقرّر.
 *
 * ⚠️ هذا الحارس **راحة استخدام لا أمان**. نشرات أمنية متعدّدة في Next.js
 * أظهرت طرق تجاوز للـ middleware. الأمان الفعلي طبقتان أخريان:
 *   1. `requireSession()` داخل كل صفحة/إجراء حساس.
 *   2. RLS في قاعدة البيانات — الطبقة الوحيدة التي لا تُتجاوز.
 */

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  // وضع البذرة المحلية: لا مستخدمين، وتفعيل الحارس يقفل التطبيق
  // على الجميع بلا طريقة دخول ممكنة.
  if (!isAuthEnabled()) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const { pathname } = request.nextUrl;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // تجديد الرمز يحدث هنا: الكتابة على الكوكيز مسموحة في الـ proxy
        // وممنوعة داخل Server Components — لهذا يعيش التجديد في هذا الموضع.
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // مستخدم مسجّل يفتح صفحة الدخول → إلى لوحة التحكم.
  if (user && isPublicPath(pathname)) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // زائر يفتح صفحة محمية → إلى الدخول، مع حفظ وجهته الأصلية.
  if (!user && !isPublicPath(pathname)) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // كل المسارات عدا الملفات الثابتة و/api و_next
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
