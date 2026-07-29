import { cn } from "@/lib/utils";
import { workOrderStatuses, type WorkOrderStatus } from "@/modules/work-orders/types";

export { workOrderStatuses };
export type { WorkOrderStatus };

/**
 * الأحمر محجوز لحالة «تحت التنفيذ» وحدها.
 * بقية الحالات محايدة أو مخفّضة التشبّع، فتقرأ العين لوحة الحالات
 * وتجد الأحمر يشير إلى العمل الجاري الآن فقط.
 */
export const statusStyles: Record<
  WorkOrderStatus,
  { dot: string; chip: string; bar: string }
> = {
  reception: {
    dot: "bg-status-reception",
    chip: "bg-status-reception-subtle text-muted-foreground",
    bar: "bg-status-reception",
  },
  inspection: {
    dot: "bg-status-inspection",
    chip: "bg-status-inspection-subtle text-info-text",
    bar: "bg-status-inspection",
  },
  awaitingApproval: {
    dot: "bg-status-awaiting-approval",
    chip: "bg-status-awaiting-approval-subtle text-warning-text",
    bar: "bg-status-awaiting-approval",
  },
  inProgress: {
    dot: "bg-status-in-progress",
    chip: "bg-status-in-progress-subtle text-danger-text",
    bar: "bg-status-in-progress",
  },
  awaitingParts: {
    dot: "bg-status-awaiting-parts",
    chip: "bg-status-awaiting-parts-subtle text-status-awaiting-parts",
    bar: "bg-status-awaiting-parts",
  },
  readyForDelivery: {
    dot: "bg-status-ready",
    chip: "bg-status-ready-subtle text-success-text",
    bar: "bg-status-ready",
  },
  delivered: {
    dot: "bg-status-delivered",
    chip: "bg-status-delivered-subtle text-muted-foreground",
    bar: "bg-status-delivered",
  },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: WorkOrderStatus;
  label: string;
  className?: string;
}) {
  const style = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        style.chip,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      {label}
    </span>
  );
}
