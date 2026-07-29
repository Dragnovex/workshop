import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "../types";

const appointmentStatusChip: Record<AppointmentStatus, string> = {
  requested: "bg-secondary text-muted-foreground",
  confirmed: "bg-info-subtle text-info-text",
  checkedIn: "bg-warning-subtle text-warning-text",
  completed: "bg-success-subtle text-success-text",
  cancelled: "border border-border text-muted-foreground",
  noShow: "border border-border text-muted-foreground",
};

export function AppointmentStatusBadge({
  status,
  label,
  className,
}: {
  status: AppointmentStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        appointmentStatusChip[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
