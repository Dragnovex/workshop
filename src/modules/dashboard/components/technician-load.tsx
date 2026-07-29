import { useLocale, useTranslations } from "next-intl";

import { SectionCard } from "@/components/patterns/section-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TechnicianLoad as TechnicianLoadEntry } from "../read-models";

export function TechnicianLoad({ technicians }: { technicians: TechnicianLoadEntry[] }) {
  const t = useTranslations("dashboard.technicians");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  return (
    <SectionCard
      title={t("title")}
      subtitle={t("subtitle")}
      contentClassName="space-y-3.5"
    >
      {technicians.map((technician) => {
        const ratio = technician.assigned / technician.capacity;
        const atCapacity = ratio >= 1;

        return (
          <div key={technician.name.en} className="flex items-center gap-3">
            <Avatar className="size-7 shrink-0">
              <AvatarFallback className="bg-secondary text-2xs font-medium">
                {technician.initials[lang]}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm">
                  {technician.name[lang]}
                </span>
                <span
                  data-numeric
                  data-ltr
                  className={cn(
                    "shrink-0 text-xs tabular-nums",
                    atCapacity
                      ? "font-medium text-danger-text"
                      : "text-muted-foreground",
                  )}
                >
                  {formatNumber(technician.assigned, locale)}/
                  {formatNumber(technician.capacity, locale)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className={cn(
                    "h-full rounded-full",
                    atCapacity ? "bg-primary" : "bg-foreground/35",
                  )}
                  style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
}
