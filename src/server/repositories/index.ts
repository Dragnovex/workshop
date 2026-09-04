import "server-only";

import { isSupabaseConfigured } from "@/server/db/supabase";

import { localRepositories } from "./local";
import { supabaseRepositories } from "./supabase";

/**
 * سجل مصادر البيانات — **المصدر الوحيد للحقيقة** لكل قراءة في التطبيق.
 *
 * كل صفحة تقرأ من هنا، لا من `modules/<domain>/data.ts` مباشرة.
 *
 * `import "server-only"` أعلاه ليس تعليقًا تحذيريًا بل حاجز فعلي: أي مكوّن
 * يحمل `"use client"` ويستورد هذا الملف **يفشل البناء فورًا** بدل أن يسرّب
 * كود الخادم ومفاتيح Supabase إلى حزمة المتصفح بصمت.
 * الحسابات الصافية التي تحتاجها الواجهة تعيش في `@/lib/services/` لهذا السبب.
 */

/**
 * التبديل يتطلب شرطين معًا، لا شرطًا واحدًا:
 *
 * 1. `DATA_SOURCE=supabase` — نيّة صريحة. لا نتحوّل لقاعدة بيانات حقيقية
 *    لمجرد أن مفتاحًا موجود في البيئة.
 * 2. المفاتيح مُهيَّأة فعلًا.
 *
 * لو طُلب supabase والمفاتيح ناقصة **نفشل بصوت عالٍ** ولا نسقط بصمت إلى
 * بيانات البذرة: نظام محاسبي يعرض أرقامًا وهمية وهو يظن نفسه متصلًا
 * أسوأ بكثير من نظام يرفض الإقلاع.
 */
/**
 * حارس وقت ترجمة: المحوّلان لازم يبقيان متطابقي الشكل.
 *
 * لو أُضيفت وحدة إلى المحوّل المحلي ونُسيت في محوّل Supabase، يفشل البناء
 * هنا بدل أن تختفي الوحدة من التطبيق بصمت بعد التبديل.
 */
type AssertSameKeys<A, B> = [keyof A, keyof B] extends [keyof B, keyof A]
  ? true
  : never;
const _shapesMatch: AssertSameKeys<
  typeof localRepositories,
  typeof supabaseRepositories
> = true;
void _shapesMatch;

const requested = process.env.DATA_SOURCE?.trim().toLowerCase();

if (requested === "supabase" && !isSupabaseConfigured()) {
  throw new Error(
    "DATA_SOURCE=supabase لكن المفاتيح ناقصة. " +
      "املأ NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في .env.local " +
      "(انظر .env.example)، أو أزل DATA_SOURCE للعمل على بيانات البذرة المحلية.",
  );
}

const useSupabase = requested === "supabase";

export const repositories = useSupabase
  ? supabaseRepositories
  : localRepositories;

/** مصدر البيانات الفعّال — تعرضه صفحة الإعدادات ولوحة التشخيص. */
export const activeDataSource: "supabase" | "local" = useSupabase
  ? "supabase"
  : "local";

export type Repositories = typeof repositories;
