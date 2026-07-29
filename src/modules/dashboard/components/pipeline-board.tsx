import { useLocale, useTranslations } from "next-intl";

import { SectionCard } from "@/components/patterns/section-card";
import { statusStyles } from "@/components/patterns/status-badge";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/modules/work-orders/types";

/**
 * مسار أوامر التشغيل.
 * أشرطة أفقية لأن أسماء المراحل عربية وطويلة — الشريط الأفقي يقرأ أسرع
 * من الأعمدة الرأسية في هذه الحالة.
 */
export function PipelineBoard({
  pipeline,
}: {
  pipeline: { status: WorkOrderStatus; count: number }[];
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const max = Math.max(1, ...pipeline.map((stage) => stage.count));

  return (
    <SectionCard
      title={t("statusBoard.title")}
      subtitle={t("statusBoard.subtitle")}
      contentClassName="space-y-3"
    >
      {pipeline.map((stage) => (
        <div key={stage.status} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground sm:w-32">
            {t(`status.${stage.status}`)}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                statusStyles[stage.status].bar,
              )}
              style={{ width: `${Math.max((stage.count / max) * 100, 4)}%` }}
            />
          </div>
          <span
            data-numeric
            className="w-7 shrink-0 text-end text-sm font-medium tabular-nums"
          >
            {formatNumber(stage.count, locale)}
          </span>
        </div>
      ))}
    </SectionCard>
  );
}
