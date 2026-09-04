import { cn } from "@/lib/utils";
import type { DailyClosingStatus } from "../types";

const statusChip: Record<DailyClosingStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  closed: "bg-success-subtle text-success-text",
};

export function DailyClosingStatusBadge({
  status,
  label,
  className,
}: {
  status: DailyClosingStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        statusChip[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
