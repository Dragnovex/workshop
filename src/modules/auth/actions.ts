"use server";

import { isAuthEnabled } from "@/lib/auth/config";
import { getSupabaseServerClient } from "@/server/db/supabase-server";

/**
 * إجراءات المصادقة على الخادم.
 *
 * كلمة المرور لا تلمس أي كود عميل غير حقل الإدخال نفسه: تُرسل إلى هنا
 * ومنها إلى Supabase مباشرة. لا تُسجَّل ولا تُخزَّن ولا تظهر في أي سجل.
 */

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "notConfigured" | "invalidCredentials" | "noProfile" };

export async function signInAction(
  email: string,
  password: string,
): Promise<SignInResult> {
  if (!isAuthEnabled()) {
    return { ok: false, reason: "notConfigured" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // رسالة واحدة لكل حالات الفشل عمدًا: التمييز بين «البريد غير موجود»
  // و«كلمة المرور خاطئة» يكشف أي الحسابات موجودة فعلًا (تعداد المستخدمين).
  if (error || !data.user) {
    return { ok: false, reason: "invalidCredentials" };
  }

  // حساب موجود في auth.users بلا ملف مفعّل = لا وصول. نُنهي الجلسة فورًا
  // بدل ترك كوكي صالح لمستخدم لا يملك أي صلاحية.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { ok: false, reason: "noProfile" };
  }

  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  if (!isAuthEnabled()) return;
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
}
