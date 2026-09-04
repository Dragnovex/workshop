import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "../types";

const invoiceStatusChip: Record<InvoiceStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  issued: "bg-info-subtle text-info-text",
  partiallyPaid: "bg-warning-subtle text-warning-text",
  paid: "bg-success-subtle text-success-text",
  overdue: "bg-danger-subtle text-danger-text",
  cancelled: "border border-border text-muted-foreground",
};

export function InvoiceStatusBadge({
  status,
  label,
  className,
}: {
  status: InvoiceStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        invoiceStatusChip[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
