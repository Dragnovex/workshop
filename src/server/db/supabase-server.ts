import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * عميل Supabase **يحمل جلسة المستخدم** — وهذا هو الفرق الجوهري عن
 * `getSupabaseAdmin()`:
 *
 * | العميل | المفتاح | RLS |
 * |---|---|---|
 * | `getSupabaseAdmin()` | service_role | **يتجاوزه بالكامل** |
 * | هذا الملف | anon + جلسة المستخدم | **يُطبَّق** |
 *
 * كل قراءة تخصّ المستخدم يجب أن تمرّ من هنا. استخدام عميل الإدارة للقراءات
 * العادية يُلغي فائدة كل سياسات RLS التي كتبناها: الاستعلام سينجح دائمًا
 * مهما كان دور المستخدم.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase غير مُهيَّأ: NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY مطلوبان في .env.local",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // الكتابة على الكوكيز ممنوعة داخل Server Component (للقراءة فقط).
          // تجديد الرمز يحدث في proxy.ts حيث الكتابة مسموحة، فتجاهل الخطأ
          // هنا سلوك صحيح لا إخفاء لعطل.
        }
      },
    },
  });
}
