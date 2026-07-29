import { cn } from "@/lib/utils";
import type { EstimateStatus } from "../types";

const estimateStatusChip: Record<EstimateStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  sent: "bg-info-subtle text-info-text",
  approved: "bg-success-subtle text-success-text",
  rejected: "border border-border text-muted-foreground",
  expired: "border border-border text-muted-foreground",
};

export function EstimateStatusBadge({
  status,
  label,
  className,
}: {
  status: EstimateStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        estimateStatusChip[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
