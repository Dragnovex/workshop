"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * تأكيد حذف موحّد لكل الوحدات.
 *
 * الحذف في هذا النظام **فعلي** ولا يمكن التراجع عنه (يُكتب فورًا في
 * localStorage)، فلا زر حذف بلا هذه الخطوة. الاسم يظهر في نص التأكيد
 * عمدًا: «هل أنت متأكد؟» المجرّدة تُوافَق عليها بلا قراءة.
 *
 * حوار واحد يُفتح ويُغلق — لا يُفتح فوق حوار Radix آخر (خلل معروف يترك
 * body.style.pointerEvents="none" عالقًا فيُجمّد الصفحة).
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  name,
  onConfirm,
  description,
  title,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** اسم السجل كما يراه المستخدم — يظهر داخل نص التأكيد. */
  name: string;
  onConfirm: () => void;
  /** نص بديل لتحذير خاص بالوحدة (مثلًا: سيُعاد المخزون). */
  description?: string;
  /** عنوان بديل — لعمليات أخرى لا رجعة فيها غير الحذف (استلام مخزون مثلًا). */
  title?: string;
  /** نص زر التأكيد — الافتراضي «حذف». */
  confirmLabel?: string;
}) {
  const t = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:opacity-100! sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? t("deleteConfirmTitle")}</DialogTitle>
          <DialogDescription>
            {description ?? t("deleteConfirmBody", { name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant={confirmLabel ? "default" : "destructive"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel ?? t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
