import "server-only";

import { getSupabaseServerClient } from "@/server/db/supabase-server";

import { isAuthEnabled } from "./config";
import type { Role, Session, SessionUser } from "./types";

/**
 * نقطة التبديل الوحيدة للجلسة في كامل التطبيق.
 *
 * تعيد `null` في وضع البذرة المحلية (لا مستخدمين أصلًا)، والجلسة الحقيقية
 * من Supabase عندما `DATA_SOURCE=supabase`. لا جلسة وهمية في أي وضع —
 * واجهة مصادقة زائفة أخطر من عدمها.
 */
export async function getSession(): Promise<Session | null> {
  if (!isAuthEnabled()) return null;

  const supabase = await getSupabaseServerClient();

  // getUser لا getSession: الأخيرة تقرأ الكوكي كما هو بلا تحقّق من التوقيع،
  // فيمكن انتحالها. getUser تسأل خادم Supabase ويتحقق من الرمز فعليًا.
  // على الخادم لا نثق بالكوكي أبدًا.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // الدور يأتي من قاعدة البيانات لا من user_metadata: الأخير قابل للتعديل
  // من العميل نفسه، فوضع الدور فيه يعني أن أي مستخدم يرقّي نفسه إلى owner.
  // جدول profiles محمي بـ RLS ولا يُعدَّل إلا بـ service_role.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name_ar, full_name_en, email, role, branch_id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  // مستخدم بلا ملف، أو ملف معطَّل = لا جلسة. وجود الحساب في auth.users
  // وحده لا يمنح أي وصول.
  if (!profile || !profile.is_active) return null;

  const sessionUser: SessionUser = {
    id: profile.id,
    name: profile.full_name_ar || profile.full_name_en,
    email: profile.email,
    role: profile.role as Role,
    branchId: profile.branch_id ?? undefined,
  };

  return {
    user: sessionUser,
    // انتهاء الرمز يديره Supabase؛ هذه القيمة للعرض فقط
    // ولا يُبنى عليها أي قرار أمني.
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

/**
 * الجلسة أو رفض. تُستخدم في أعلى كل صفحة أو إجراء يحتاج مستخدمًا مسجّلًا.
 *
 * الفرض في `proxy.ts` وحده لا يكفي: نشرات أمنية متعدّدة في Next.js أظهرت
 * طرقًا لتجاوز الـ middleware. التحقق هنا — في الخادم عند نقطة الاستخدام —
 * طبقة فوق RLS في قاعدة البيانات، والثلاث معًا هي الحماية.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
