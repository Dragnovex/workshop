import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "../types";

const employeeStatusChip: Record<EmployeeStatus, string> = {
  active: "bg-success-subtle text-success-text",
  onLeave: "bg-warning-subtle text-warning-text",
  inactive: "border border-border text-muted-foreground",
};

export function EmployeeStatusBadge({
  status,
  label,
  className,
}: {
  status: EmployeeStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        employeeStatusChip[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
