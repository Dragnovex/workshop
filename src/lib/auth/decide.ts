import { can } from "./permissions";
import type { Permission, SessionUser } from "./types";

/**
 * قرار السماح بكتابة — **دالة صافية** بلا خادم ولا شبكة ولا بيئة.
 *
 * مستخرجة من `server/actions/guard.ts` عمدًا: ذلك الملف يستورد
 * `server-only` فلا يمكن اختباره، وترك أهم قرار أمني في النظام بلا اختبار
 * لأنه محشور في ملف غير قابل للاستيراد مقايضة سيئة.
 *
 * `authEnabled = false` يعني وضع البذرة المحلية: لا مستخدمين أصلًا فلا
 * جلسة تُفحص (نفس القرار الموثّق في `auth/config.ts`، ولهذا يمنع AGENTS
 * النشر في هذا الوضع).
 */
export type PermissionDecision =
  | { allow: true }
  | { allow: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" };

export function decidePermission({
  authEnabled,
  user,
  permission,
}: {
  authEnabled: boolean;
  user: SessionUser | null;
  permission: Permission;
}): PermissionDecision {
  if (!authEnabled) return { allow: true };
  if (!user) return { allow: false, reason: "UNAUTHENTICATED" };
  if (!can(user, permission)) return { allow: false, reason: "FORBIDDEN" };
  return { allow: true };
}
