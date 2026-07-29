import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatTone = "neutral" | "accent";

/**
 * بطاقة مؤشّر.
 * الافتراضي محايد تمامًا؛ نبرة accent (الأحمر) تُستخدم لمؤشّر واحد فقط
 * في الشاشة — وإلا فقد الأحمر معناه.
 */
export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  tone?: StatTone;
}) {
  const isUp = (delta ?? 0) >= 0;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="surface-card group relative overflow-hidden p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-5 text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            tone === "accent"
              ? "bg-primary-subtle text-primary-text"
              : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          data-numeric
          className={cn(
            "text-3xl leading-none font-semibold tracking-tight",
            tone === "accent" && "text-primary-text",
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-sm text-muted-foreground">{unit}</span>
        ) : null}
      </div>

      {delta !== undefined ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-medium",
              isUp
                ? "bg-success-subtle text-success-text"
                : "bg-danger-subtle text-danger-text",
            )}
          >
            <DeltaIcon className="size-3 rtl:-scale-x-100" />
            <span data-numeric data-ltr>
              {Math.abs(delta)}%
            </span>
          </span>
          {deltaLabel ? (
            <span className="truncate text-muted-foreground">{deltaLabel}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
