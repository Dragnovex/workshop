import { cn } from "@/lib/utils";
import type { CampaignStatus } from "../types";

const campaignStatusChip: Record<CampaignStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  scheduled: "bg-info-subtle text-info-text",
  active: "bg-success-subtle text-success-text",
  completed: "border border-border text-muted-foreground",
  paused: "bg-warning-subtle text-warning-text",
};

export function CampaignStatusBadge({
  status,
  label,
  className,
}: {
  status: CampaignStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        campaignStatusChip[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
