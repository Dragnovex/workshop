import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * عملاء Supabase — **للخادم فقط** (`server-only` أعلاه يفرضها وقت البناء).
 *
 * الإنشاء كسول (lazy) عمدًا: بلا متغيّرات بيئة يبقى التطبيق يعمل على بيانات
 * البذرة المحلية، ولا ينهار البناء لمجرد أن المفاتيح غير موجودة.
 */

let cachedAdmin: SupabaseClient | null = null;

/** هل الاتصال بـ Supabase مُهيَّأ فعليًا؟ يقرأه سجل المستودعات لاختيار المحوّل. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * عميل بصلاحيات `service_role` — **يتجاوز Row Level Security بالكامل**.
 *
 * لا يُستخدم إلا في كود خادم يفرض الصلاحية بنفسه (Server Actions، مهام إدارية).
 * لا يُمرَّر إلى العميل ولا يُستدعى من مكوّن `"use client"` — `server-only`
 * يمنع ذلك وقت البناء لا وقت التشغيل.
 *
 * ملاحظة أمنية مقصودة: هذا المسار لا يعرف هوية المستخدم، فالتحقق من
 * الصلاحية مسؤولية المُستدعي. عند وصول المصادقة (المرحلة د) يجب أن تصبح
 * القراءات العادية عبر عميل يحمل جلسة المستخدم ليُطبَّق RLS، ويبقى هذا
 * العميل للعمليات الإدارية وحدها.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase غير مُهيَّأ: NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY مطلوبان في .env.local",
    );
  }

  cachedAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}
