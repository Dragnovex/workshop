import "server-only";

import type { Session } from "./types";

/**
 * نقطة التبديل الوحيدة للجلسة في كامل التطبيق.
 *
 * المرحلة الأولى: لا توجد مصادقة. تُعيد null دائمًا،
 * ولا يوجد أي كوكي أو جلسة وهمية — واجهة مصادقة زائفة أخطر من عدمها.
 *
 * المرحلة الثانية (Auth.js): يُستبدل جسم الدالة بسطر واحد:
 *
 *   import { auth } from "@/lib/auth/config";
 *   export const getSession = auth;
 *
 * لا شيء آخر في التطبيق يحتاج تعديلًا.
 */
export async function getSession(): Promise<Session | null> {
  return null;
}
