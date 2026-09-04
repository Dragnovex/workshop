"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useCan } from "@/lib/auth/permission-context";
import type { Resource } from "@/lib/auth/types";

/**
 * إجراءات الصف (تعديل/حذف) — موحّدة لكل الجداول.
 *
 * زران مباشران لا قائمة منسدلة: فتح حوار Radix من داخل قائمة Radix يمرّ
 * بإغلاق طبقة ثم فتح أخرى في نفس الإطار، وهو بالضبط النمط الذي ترك
 * `body.style.pointerEvents="none"` عالقًا في هذا المشروع من قبل. زران
 * ظاهران أبسط، وأفضل على الجوال، وأقل نقرة للمستخدم.
 *
 * الأزرار تختفي إذا لم يسمح الدور، لكن **الإخفاء ليس المنع**: كل دالة
 * تُستدعى تمرّ بدورها على `useGuard` قبل أي كتابة.
 */
export function RowActions({
  resource,
  onEdit,
  onDelete,
  label,
}: {
  resource: Resource;
  onEdit?: () => void;
  onDelete?: () => void;
  /** وصف السجل — يدخل في aria-label حتى لا تتشابه كل الأزرار على قارئ الشاشة. */
  label: string;
}) {
  const t = useTranslations("common");
  const can = useCan();

  const canEdit = Boolean(onEdit) && can(`${resource}:update`);
  const canDelete = Boolean(onDelete) && can(`${resource}:delete`);

  if (!canEdit && !canDelete) return null;

  return (
    // z-10 يرفع الأزرار فوق طبقة ::after التي تجعل الصف كله قابلًا للنقر،
    // و stopPropagation يمنع فتح صفحة التفاصيل عند الضغط على زر إجراء.
    <div
      className="relative z-10 flex items-center justify-end gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      {canEdit ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`${t("edit")} — ${label}`}
          onClick={onEdit}
        >
          <Pencil className="size-4" />
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          aria-label={`${t("delete")} — ${label}`}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
