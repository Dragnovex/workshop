"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

/** ترقيم صفحات موحّد للجداول — عميل بالكامل فوق مصفوفة مفلترة/مفروزة مسبقًا. */
export function TablePagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("common");
  const locale = useLocale();

  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted-foreground" data-numeric>
        {t("paginationSummary", {
          start: formatNumber(start, locale),
          end: formatNumber(end, locale),
          total: formatNumber(totalItems, locale),
        })}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("previousPage")}
        >
          <ChevronRight aria-hidden="true" className="size-4 ltr:rotate-180" />
        </Button>
        <span className="min-w-14 text-center text-xs text-muted-foreground" data-numeric>
          {formatNumber(page, locale)} / {formatNumber(pageCount, locale)}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("nextPage")}
        >
          <ChevronLeft aria-hidden="true" className="size-4 ltr:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
