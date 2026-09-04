import "server-only";

import { isAuthEnabled } from "@/lib/auth/config";
import { decidePermission } from "@/lib/auth/decide";
import { getSession } from "@/lib/auth/session";
import type { Permission, SessionUser } from "@/lib/auth/types";

/**
 * نقطة فرض الصلاحية الوحيدة على الخادم.
 *
 * **هذه هي الطبقة التي تُعتبر أمانًا**، لا `useGuard` في الواجهة: الأخيرة
 * تُخفي أزرارًا وترفض نقرات، لكن من يستدعي الـ Server Action مباشرةً
 * (fetch، امتداد متصفح، سكربت) لا يمرّ بها إطلاقًا. كل Action يكتب بيانات
 * يجب أن يبدأ من هنا — بلا استثناء واحد.
 *
 * ثلاث طبقات مقصودة معًا: الواجهة (راحة) ← هذه (فرض) ← RLS في قاعدة
 * البيانات (الحصن الأخير الذي لا يُتجاوَز حتى لو أخطأ الكود هنا).
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

/**
 * أخطاء يفهمها المستخدم. النص لا يُبنى هنا: الرسائل تعيش في
 * `messages/*.json` (قاعدة AGENTS رقم ٥)، والواجهة تترجم الرمز.
 */
export type ActionError =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "STORAGE_FAILED";

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionFailed<T>(error: ActionError): ActionResult<T> {
  return { ok: false, error };
}

/**
 * التحقق من الصلاحية قبل أي كتابة.
 *
 * في وضع البذرة (`DATA_SOURCE` فارغ) لا مصادقة ولا مستخدمون أصلًا، فلا
 * جلسة تُفحص. هذا **ليس ثغرة أُغفلت** بل نفس القرار الموثّق في
 * `auth/config.ts`: تفعيل الحارس على بيانات بلا مستخدمين يقفل التطبيق على
 * الجميع بلا طريقة دخول. ولهذا بالضبط يمنع AGENTS النشر في وضع البذرة.
 *
 * ما إن تُفعَّل المصادقة يصبح المسار: جلسة حقيقية ← دور من قاعدة البيانات
 * ← مصفوفة الصلاحيات، بلا أي اعتبار لما يدّعيه العميل.
 */
export async function requirePermission(
  permission: Permission,
): Promise<{ ok: true; user: SessionUser | null } | { ok: false; error: ActionError }> {
  const authEnabled = isAuthEnabled();
  // الجلسة تُقرأ فقط عند تفعيل المصادقة: في وضع البذرة لا يوجد Supabase
  // أصلًا، واستدعاؤها هناك خطأ تشغيل لا تحقّق أمني.
  const user = authEnabled ? ((await getSession())?.user ?? null) : null;

  // القرار نفسه في دالة صافية مختبَرة — انظر lib/auth/decide.ts.
  const decision = decidePermission({ authEnabled, user, permission });
  if (!decision.allow) return { ok: false, error: decision.reason };

  return { ok: true, user };
}

/**
 * غلاف موحّد: يفحص الصلاحية، ينفّذ العملية، ويحوّل أي استثناء إلى نتيجة
 * مكتوبة النوع.
 *
 * الاستثناء لا يُترك يتسرّب إلى العميل: رسالة خطأ خام من قاعدة البيانات
 * قد تكشف أسماء جداول وبنية المخطّط، والمستخدم لا يستفيد منها شيئًا.
 * تُسجَّل على الخادم كاملةً ويصل العميل رمزًا فقط.
 */
export async function withPermission<T>(
  permission: Permission,
  operation: (user: SessionUser | null) => Promise<T>,
): Promise<ActionResult<T>> {
  const authorized = await requirePermission(permission);
  if (!authorized.ok) return actionFailed(authorized.error);

  try {
    return actionOk(await operation(authorized.user));
  } catch (error) {
    console.error(`action failed [${permission}]`, error);
    // «غير موجود» تُميَّز عن فشل التخزين: الأولى تعني أن السجل حُذف من
    // جهاز آخر (تُعالَج بتحديث الشاشة)، والثانية عطل يستحق إعادة محاولة.
    const message = error instanceof Error ? error.message : "";
    return actionFailed(
      message.includes("لا يوجد سجل") ? "NOT_FOUND" : "STORAGE_FAILED",
    );
  }
}
