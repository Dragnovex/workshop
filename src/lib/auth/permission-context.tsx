"use client";

import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { can } from "./permissions";
import {
  getRolePreviewServerSnapshot,
  getRolePreviewSnapshot,
  setRolePreview,
  subscribeRolePreview,
} from "./role-preview";
import type { Permission, Role, SessionUser } from "./types";

/**
 * طبقة الصلاحيات على العميل.
 *
 * **الطبقة الأولى وحدها ليست أمانًا** — الفرض الحقيقي في RLS داخل قاعدة
 * البيانات (`0009_auth_profiles_and_rls.sql`) وفي Server Actions. لكن هذه
 * الطبقة ليست زخرفة أيضًا: `assertPermission` تُستدعى **قبل كل mutation**
 * في الواجهة وترفض العملية فعليًا بدل الاكتفاء بإخفاء زر.
 *
 * مصدر الدور:
 *   • `DATA_SOURCE=supabase` → الجلسة الحقيقية (تُمرَّر من التخطيط).
 *   • وضع البذرة            → دور المعاينة المحلي (انظر role-preview.ts —
 *                              ليس جلسة ولا يمنح وصولًا لأي بيانات).
 */

type PermissionContextValue = {
  /** المستخدم الحقيقي من الجلسة — `null` في وضع البذرة. */
  sessionUser: SessionUser | null;
  /** هل المصادقة مفعّلة فعليًا على الخادم؟ */
  authEnabled: boolean;
  /** الدور الفعّال المستخدَم في التحقق — `null` = غير معروف بعد (يُرفض كل شيء). */
  role: Role | null;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  user,
  authEnabled,
  children,
}: {
  user: SessionUser | null;
  authEnabled: boolean;
  children: React.ReactNode;
}) {
  const previewRole = useSyncExternalStore(
    subscribeRolePreview,
    getRolePreviewSnapshot,
    getRolePreviewServerSnapshot,
  );

  const value = useMemo<PermissionContextValue>(
    () => ({
      sessionUser: user,
      authEnabled,
      // المصادقة مفعّلة ⇒ الجلسة وحدها مصدر الدور. لا يُسمح لدور المعاينة
      // المحلي بأن يرفع أحدًا فوق دوره الحقيقي بأي حال.
      role: authEnabled ? (user?.role ?? null) : previewRole,
    }),
    [authEnabled, previewRole, user],
  );

  return (
    <PermissionContext value={value}>{children}</PermissionContext>
  );
}

function usePermissionContext(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissionContext خارج PermissionProvider");
  }
  return context;
}

/** الدور الفعّال، و`null` حين لا يكون معروفًا بعد. */
export function useCurrentRole(): Role | null {
  return usePermissionContext().role;
}

export function useAuthEnabled(): boolean {
  return usePermissionContext().authEnabled;
}

/**
 * فحص صلاحية صامت — للإظهار والإخفاء فقط.
 * الإخفاء وحده ليس منعًا: كل mutation تمر أيضًا عبر `useGuard`.
 */
export function useCan(): (permission: Permission) => boolean {
  const { role } = usePermissionContext();
  return useCallback(
    (permission: Permission) => {
      if (!role) return false;
      // `can` تتوقّع SessionUser؛ الحقول الأخرى لا تدخل في القرار إطلاقًا،
      // القرار من الدور وحده — لهذا نمرّر الحد الأدنى.
      return can({ id: "", name: "", email: "", role }, permission);
    },
    [role],
  );
}

/**
 * الحارس الفعلي: يُستدعى في أول سطر من كل دالة تعدّل بيانات.
 * يرجع `false` ويعرض سبب المنع بدل تنفيذ العملية.
 *
 *   if (!guard("customers:delete")) return;
 */
export function useGuard(): (permission: Permission) => boolean {
  const check = useCan();
  const t = useTranslations("permissions");
  return useCallback(
    (permission: Permission) => {
      if (check(permission)) return true;
      toast.error(t("denied"), { description: t("deniedDescription") });
      return false;
    },
    [check, t],
  );
}

/** تبديل دور المعاينة — معطَّل تمامًا حين تكون المصادقة الحقيقية مفعّلة. */
export function useSetPreviewRole(): ((role: Role) => boolean) | null {
  const { authEnabled } = usePermissionContext();
  return authEnabled ? null : setRolePreview;
}
