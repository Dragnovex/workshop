"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * حوار نموذج عام — الإنشاء والتعديل معًا لأي سجل بسيط.
 *
 * وُجد لأن ثماني وحدات كانت ستكرّر نفس ٢٠٠ سطر بفارق أسماء الحقول فقط.
 * الوحدات ذات القواعد الحقيقية (العميل ورقمه الضريبي، الفاتورة وضريبتها)
 * تحتفظ بنماذجها الخاصة ومخططات Zod الخاصة بها — هذا الحوار للحقول
 * المباشرة لا لمنطق الأعمال.
 *
 * التحقق هنا هيكلي فقط: المطلوب ليس فارغًا، والرقم رقم فعلًا. أي قاعدة
 * أعمال تُمرَّر عبر `validate`.
 */

export type FormFieldDef = {
  name: string;
  label: string;
  kind: "text" | "number" | "date" | "datetime" | "textarea" | "select";
  required?: boolean;
  /** خيارات القائمة — لـ kind = "select" فقط. */
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** حقول لاتينية (لوحة، رقم ضريبي، بريد) تُعرض LTR داخل واجهة عربية. */
  ltr?: boolean;
  /** يمتد على عرض العمودين. */
  wide?: boolean;
  hint?: string;
};

export type FormValues = Record<string, string>;

/** حقول التاريخ تُعرض LTR دائمًا: منتقي المتصفح نفسه لاتيني الترتيب. */
function isDateKind(kind: FormFieldDef["kind"]): boolean {
  return kind === "date" || kind === "datetime";
}

export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initialValues,
  submitLabel,
  onSubmit,
  validate,
  idPrefix,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormFieldDef[];
  initialValues: FormValues;
  submitLabel?: string;
  /**
   * يعيد `true` عند نجاح الحفظ فعليًا — الحوار لا يُغلق قبل ذلك.
   * يقبل `Promise` لأن الحفظ صار يمرّ بالخادم في الوحدات المحوَّلة.
   */
  onSubmit: (values: FormValues) => boolean | Promise<boolean>;
  /** قاعدة أعمال إضافية — تعيد رسالة خطأ أو `null` عند القبول. */
  validate?: (values: FormValues) => string | null;
  /** بادئة معرّفات الحقول — تمنع تكرار id عند وجود أكثر من نموذج في الصفحة. */
  idPrefix: string;
}) {
  const tCommon = useTranslations("common");
  const [values, setValues] = useState<FormValues>(initialValues);
  // يمنع الحفظ المزدوج: ضغطة ثانية قبل رد الخادم كانت ستُنشئ سجلين.
  const [saving, setSaving] = useState(false);

  // إعادة التعبئة عند فتح الحوار: بلا هذا يفتح على بيانات السجل السابق
  // فيُعدَّل الخطأ منها.
  //
  // التعديل يتم **أثناء الرسم** لا داخل Effect: الأخير يرسم إطارًا كاملًا
  // بالقيم القديمة قبل أن يصحّحها (وميض مرئي + رسم متتالٍ). هذا هو النمط
  // الذي توثّقه React لإعادة ضبط الحالة عند تغيّر خاصية.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValues(initialValues);
  }

  async function handleSubmit() {
    if (saving) return;
    for (const field of fields) {
      const value = (values[field.name] ?? "").trim();
      if (field.required && value === "") {
        toast.error(`${field.label} — ${tCommon("required")}`);
        return;
      }
      if (field.kind === "number" && value !== "" && !Number.isFinite(Number(value))) {
        toast.error(`${field.label} — ${tCommon("invalidNumber")}`);
        return;
      }
    }

    const businessError = validate?.(values);
    if (businessError) {
      toast.error(businessError);
      return;
    }

    // الحفظ قد يفشل فعليًا (صلاحية مرفوضة، تخزين، شبكة) — لا نغلق الحوار
    // حينها حتى لا يفقد المستخدم ما كتبه.
    setSaving(true);
    try {
      if (!(await onSubmit(values))) return;
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  function setValue(name: string, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:opacity-100! max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {fields.map((field) => {
            const id = `${idPrefix}-${field.name}`;
            const value = values[field.name] ?? "";
            return (
              <div
                key={field.name}
                className={`grid gap-2 ${field.wide ? "sm:col-span-2" : ""}`}
              >
                <Label htmlFor={id}>
                  {field.label}
                  {field.required ? (
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  ) : null}
                </Label>

                {field.kind === "select" ? (
                  <Select value={value} onValueChange={(next) => setValue(field.name, next)}>
                    <SelectTrigger id={id} className="w-full">
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.kind === "textarea" ? (
                  <Textarea
                    id={id}
                    value={value}
                    rows={3}
                    placeholder={field.placeholder}
                    onChange={(event) => setValue(field.name, event.target.value)}
                  />
                ) : (
                  <Input
                    id={id}
                    value={value}
                    type={
                      field.kind === "date"
                        ? "date"
                        : field.kind === "datetime"
                          ? "datetime-local"
                          : "text"
                    }
                    inputMode={field.kind === "number" ? "decimal" : undefined}
                    placeholder={field.placeholder}
                    dir={field.ltr || isDateKind(field.kind) ? "ltr" : undefined}
                    className={field.ltr || isDateKind(field.kind) ? "text-end" : undefined}
                    onChange={(event) => setValue(field.name, event.target.value)}
                  />
                )}

                {field.hint ? (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="button" disabled={saving} onClick={handleSubmit}>
            {saving ? tCommon("loading") : (submitLabel ?? tCommon("save"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
