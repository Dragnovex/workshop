"use client";

import { CalendarRange, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isRangeActive, type DateRange } from "@/lib/date-range";

/**
 * فلتر «من تاريخ إلى تاريخ» — نمط برنامج محاسبي: حقلان ظاهران دائمًا،
 * لا منتقي مخفي خلف قائمة. المحاسب يبحث بالتاريخ أكثر من أي شيء آخر،
 * وإخفاء الحقل خلف نقرة إضافية يكلّفه عشرات النقرات في اليوم.
 *
 * حقول التاريخ تُعرض LTR دائمًا: منتقي المتصفح نفسه لاتيني الترتيب.
 */
export function DateRangeFilter({
  value,
  onChange,
  idPrefix,
  className,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  /** بادئة معرّفات الحقول — تمنع تكرار id عند وجود أكثر من فلتر في الصفحة. */
  idPrefix: string;
  className?: string;
}) {
  const t = useTranslations("common");

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-end ${className ?? ""}`}>
      <div className="flex items-center gap-2 text-muted-foreground sm:pb-2">
        <CalendarRange aria-hidden="true" className="size-4" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-from`} className="text-xs">
          {t("from")}
        </Label>
        <Input
          id={`${idPrefix}-from`}
          type="date"
          value={value.from}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
          dir="ltr"
          className="w-full text-end sm:w-44"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-to`} className="text-xs">
          {t("to")}
        </Label>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          value={value.to}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
          dir="ltr"
          className="w-full text-end sm:w-44"
        />
      </div>
      {isRangeActive(value) ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => onChange({ from: "", to: "" })}
        >
          <X className="size-4" />
          {t("clearFilters")}
        </Button>
      ) : null}
    </div>
  );
}
