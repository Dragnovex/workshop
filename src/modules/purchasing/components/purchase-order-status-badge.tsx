import { cn } from "@/lib/utils";
import type { PurchaseOrderStatus } from "../types";

const purchaseOrderStatusChip: Record<PurchaseOrderStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  ordered: "bg-info-subtle text-info-text",
  partiallyReceived: "bg-warning-subtle text-warning-text",
  received: "bg-success-subtle text-success-text",
  cancelled: "border border-border text-muted-foreground",
};

export function PurchaseOrderStatusBadge({
  status,
  label,
  className,
}: {
  status: PurchaseOrderStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        purchaseOrderStatusChip[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
