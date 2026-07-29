import { useLocale, useTranslations } from "next-intl";

import { SectionCard } from "@/components/patterns/section-card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BayState } from "../read-models";

const bayStyles: Record<BayState, string> = {
  busy: "border-primary-border bg-primary-subtle text-primary-subtle-foreground",
  free: "border-border bg-surface-subtle text-muted-foreground",
};

const legendDot: Record<BayState, string> = {
  busy: "bg-primary",
  free: "bg-border-strong",
};

export function BayGrid({ bays }: { bays: { id: number; state: BayState }[] }) {
  const t = useTranslations("dashboard.bays");
  const locale = useLocale();

  return (
    <SectionCard title={t("title")} contentClassName="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {bays.map((bay) => (
          <div
            key={bay.id}
            className={cn(
              "flex aspect-4/3 items-center justify-center rounded-md border text-sm font-medium tabular-nums",
              bayStyles[bay.state],
            )}
          >
            <span data-numeric>{formatNumber(bay.id, locale)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
        {(["busy", "free"] as const).map((state) => (
          <span
            key={state}
            className="inline-flex items-center gap-1.5 text-2xs text-muted-foreground"
          >
            <span
              className={cn("size-1.5 rounded-full", legendDot[state])}
            />
            {t(state)}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}
