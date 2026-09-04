"use client";

import type { Role } from "./types";

/**
 * دور المعاينة — **وضع البذرة المحلية فقط**.
 *
 * ⚠️ هذا **ليس جلسة** ولا كوكي مصادقة ولا بديل عنها (قاعدة AGENTS رقم ٧).
 * لا يُقرأ على الخادم إطلاقًا، ولا يمنح وصولًا إلى أي بيانات، ولا يُرسل في
 * أي طلب. عند `DATA_SOURCE=supabase` تتجاهله طبقة الصلاحيات بالكامل
 * ويأتي الدور من الجلسة الحقيقية في `session.ts` وحدها.
 *
 * سبب وجوده: النظام الآن يعدّل ويحذف سجلات فعليًا، ومسار التحقق من
 * الصلاحية يجب أن يكون **مُنفَّذًا ومُختبَرًا** قبل وصول الباك-إند لا مضافًا
 * فوقه لاحقًا. بلا دور في وضع البذرة (حيث لا مستخدمين أصلًا) يبقى مسار
 * `assertPermission` ميتًا لا يمر به أحد.
 *
 * القراءة عبر `useSyncExternalStore` عمدًا: قراءة localStorage أثناء الرسم
 * تُنتج اختلاف ترطيب (hydration mismatch)، ولقطة الخادم `null` تعني
 * «لا صلاحية بعد» فتبقى أزرار التعديل والحذف مخفية حتى يُعرف الدور —
 * الاتجاه الآمن.
 */
const STORAGE_KEY = "3mr-workshop-role-preview-v1";

export const previewableRoles: Role[] = [
  "owner",
  "manager",
  "serviceAdvisor",
  "technician",
  "storekeeper",
  "accountant",
  "receptionist",
];

const listeners = new Set<() => void>();

/** لقطة مُخزَّنة: useSyncExternalStore يتطلب مرجعًا ثابتًا بين النداءات. */
let snapshot: Role | null = null;
let snapshotLoaded = false;

function readStorage(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && (previewableRoles as string[]).includes(raw)) {
      return raw as Role;
    }
  } catch {
    // تخزين محجوب — نسقط إلى الدور الافتراضي أدناه.
  }
  return "owner";
}

export function subscribeRolePreview(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRolePreviewSnapshot(): Role | null {
  if (!snapshotLoaded) {
    snapshot = readStorage();
    snapshotLoaded = true;
  }
  return snapshot;
}

/** لقطة الخادم: لا دور — الأزرار الحسّاسة تبقى مخفية حتى يعمل العميل. */
export function getRolePreviewServerSnapshot(): Role | null {
  return null;
}

/** تعيد `true` عند نجاح الحفظ فعليًا. */
export function setRolePreview(role: Role): boolean {
  snapshot = role;
  snapshotLoaded = true;
  let ok = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, role);
  } catch (error) {
    console.error("setRolePreview failed", error);
    ok = false;
  }
  for (const listener of listeners) listener();
  return ok;
}
