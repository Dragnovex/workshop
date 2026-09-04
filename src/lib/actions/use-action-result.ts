"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import type { ActionError, ActionResult } from "@/server/actions/guard";

/**
 * تحويل نتيجة Server Action إلى ردّ فعل مرئي.
 *
 * سبب وجوده: الخادم يعيد **رمز خطأ** لا نصًا (رسائل قاعدة البيانات قد
 * تكشف بنية المخطّط، والنصوص تعيش في `messages/*.json`). هذا المكان
 * الوحيد الذي يترجم الرمز، فلا تتكرر السلسلة في كل وحدة وتنحرف.
 *
 * عند النجاح يُستدعى `router.refresh()`: البيانات تُقرأ من الخادم، فبلا
 * تحديث تبقى الشاشة تعرض ما قبل الكتابة.
 */
export function useActionResult() {
  const t = useTranslations("errors.action");
  const router = useRouter();

  return useCallback(
    <T>(result: ActionResult<T>, successMessage?: string): result is { ok: true; data: T } => {
      if (!result.ok) {
        toast.error(t(result.error satisfies ActionError));
        return false;
      }
      if (successMessage) toast.success(successMessage);
      router.refresh();
      return true;
    },
    [router, t],
  );
}
